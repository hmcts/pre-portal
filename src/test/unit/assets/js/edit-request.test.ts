/**
 * @jest-environment jsdom
 */

import { EditRequestManager } from '../../../../main/assets/js/edit-request';
import { setupEditRequestManagerDom } from '../../mock-nunjucks-dom-helper';

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('EditRequestManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    (window.HTMLElement.prototype as any).scrollIntoView = jest.fn();
  });

  it('returns early for missing config and ignores invalid config JSON', () => {
    const missingConfig = document.createElement('div');
    const invalidConfig = document.createElement('div');
    invalidConfig.setAttribute('data-config', '{invalid-json');

    expect(() => new EditRequestManager(missingConfig)).not.toThrow();
    expect(() => new EditRequestManager(invalidConfig)).not.toThrow();
  });

  it('disables submit and shows submit error when there are no instructions', async () => {
    const { moduleElement, submitButton, addButton, editRow } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;

    expect(submitButton.disabled).toBe(true);

    submitButton.disabled = false;
    submitButton.click();
    expect((document.getElementById('submit-error-summary') as HTMLElement).style.display).toBe('block');

    addButton.click();
    expect(editRow.hidden).toBe(false);
    expect(manager).toBeDefined();
  });

  it('submits new instruction payload and enables submit after successful save', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '123',
        edit_instructions: [{ start_of_cut: '00:00:01', end_of_cut: '00:00:03', reason: 'Noise' }],
      }),
    });
    (global as any).fetch = fetchMock;

    const { moduleElement, startInput, endInput, reasonInput, submitButton } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;

    startInput.value = '00:00:01';
    endInput.value = '00:00:03';
    reasonInput.value = 'Noise';

    manager.handleAction('save');
    await flushPromises();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.edit_instructions[0]).toEqual({
      start_of_cut: '00:00:01',
      end_of_cut: '00:00:03',
      reason: 'Noise',
    });
    expect(submitButton.disabled).toBe(false);
    expect((document.getElementById('edit-request-loading') as HTMLElement).style.display).toBe('none');
  });

  it('shows update form with selected instruction values', async () => {
    const { moduleElement } = await setupEditRequestManagerDom([
      { start_of_cut: '00:00:11', end_of_cut: '00:00:22', reason: 'First' },
      { start_of_cut: '00:00:33', end_of_cut: '00:00:44', reason: 'Second' },
    ]);
    const manager = new EditRequestManager(moduleElement) as any;

    manager.handleAction('update', 1);

    const startInput = document.getElementById('start-time-input') as HTMLInputElement;
    const endInput = document.getElementById('end-time-input') as HTMLInputElement;
    const reasonInput = document.getElementById('reason-input') as HTMLInputElement;

    expect(startInput.value).toBe('00:00:33');
    expect(endInput.value).toBe('00:00:44');
    expect(reasonInput.value).toBe('Second');
    expect(document.getElementById('instruction-1')).toBeNull();
  });

  it('renders and cancels delete confirmation flow', async () => {
    const { moduleElement } = await setupEditRequestManagerDom([
      { start_of_cut: '00:00:11', end_of_cut: '00:00:22', reason: 'Delete me', difference: '00:00:11' },
    ]);
    const manager = new EditRequestManager(moduleElement) as any;

    manager.handleAction('delete', 0);
    expect(document.getElementById('delete-reference-row')).not.toBeNull();
    expect(document.getElementById('instruction-0')).toBeNull();

    manager.handleAction('cancel-delete');
    expect(document.getElementById('delete-reference-row')).toBeNull();
  });

  it('submits delete payload on confirm-delete and strips instruction ids', async () => {
    const existing = [
      { _id: 'a', start_of_cut: '00:00:01', end_of_cut: '00:00:02', reason: 'A' },
      { _id: 'b', start_of_cut: '00:00:03', end_of_cut: '00:00:04', reason: 'B' },
    ];
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: '123', edit_instructions: [existing[1]] }) });
    (global as any).fetch = fetchMock;

    const { moduleElement } = await setupEditRequestManagerDom(existing as any);
    const manager = new EditRequestManager(moduleElement) as any;

    manager.handleAction('confirm-delete', 0);
    await flushPromises();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.edit_instructions).toEqual([{ start_of_cut: '00:00:03', end_of_cut: '00:00:04', reason: 'B' }]);
  });

  it('shows field-level validation errors returned by the API', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errors: { startTime: 'Bad start', endTime: 'Bad end' } }),
    });

    const { moduleElement, startInput, endInput, reasonInput } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;

    startInput.value = 'not-a-time';
    endInput.value = 'also-bad';
    reasonInput.value = 'x';

    manager.handleAction('save');
    await flushPromises();

    expect(document.getElementById('start-form-group')?.classList.contains('govuk-form-group--error')).toBe(true);
    expect(document.getElementById('end-form-group')?.classList.contains('govuk-form-group--error')).toBe(true);
  });

  it('shows overlap error summary and then clears it on cancel', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ errors: { overlap: 'Overlapping Instructions' } }) });

    const { moduleElement, startInput, endInput, reasonInput, editRow } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;

    editRow.hidden = true;
    startInput.value = '00:00:01';
    endInput.value = '00:00:02';
    reasonInput.value = 'x';

    manager.handleAction('save');
    await flushPromises();

    expect((document.getElementById('validation-error-summary') as HTMLElement).style.display).toBe('block');
    expect((document.getElementById('validation-error-list') as HTMLElement).textContent).toContain(
      'Overlapping Instructions'
    );

    manager.handleAction('cancel');
    expect((document.getElementById('validation-error-summary') as HTMLElement).style.display).toBe('none');
    expect(editRow.hidden).toBe(true);
  });

  it('short-circuits form submit while already submitting and when submitter is absent', async () => {
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    const { moduleElement } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;
    const form = document.getElementById('new-edit-reference-form') as HTMLFormElement;

    manager.isSubmitting = true;
    const eventWhileSubmitting = new Event('submit', { bubbles: true, cancelable: true }) as any;
    Object.defineProperty(eventWhileSubmitting, 'submitter', {
      value: document.querySelector('[data-edit-action="save"]'),
    });
    form.dispatchEvent(eventWhileSubmitting);

    manager.isSubmitting = false;
    const eventWithoutSubmitter = new Event('submit', { bubbles: true, cancelable: true }) as any;
    form.dispatchEvent(eventWithoutSubmitter);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('toggles submitting state and handles missing DOM elements safely', async () => {
    const { moduleElement, addButton, submitButton } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;
    const form = document.getElementById('new-edit-reference-form') as HTMLFormElement;

    manager.setSubmitting(true);
    expect((document.getElementById('edit-request-loading') as HTMLElement).style.display).toBe('block');
    expect(addButton.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(form.getAttribute('aria-busy')).toBe('true');

    document.getElementById('edit-request-loading')?.remove();
    document.querySelector('[data-edit-action="add"]')?.remove();
    document.getElementById('submit-button')?.remove();
    form.remove();

    expect(() => manager.setSubmitting(false)).not.toThrow();
  });

  it('handles submit network failures without crashing', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network failure'));

    const { moduleElement, startInput, endInput, reasonInput } = await setupEditRequestManagerDom();
    const manager = new EditRequestManager(moduleElement) as any;

    startInput.value = '00:00:01';
    endInput.value = '00:00:02';
    reasonInput.value = 'x';

    manager.handleAction('save');
    await flushPromises();

    expect((document.getElementById('edit-request-loading') as HTMLElement).style.display).toBe('none');
  });
});
