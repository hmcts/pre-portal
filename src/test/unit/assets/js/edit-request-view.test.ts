/**
 * @jest-environment jsdom
 */

import { EditRequestView } from '../../../../main/assets/js/edit-request-view';
import { setupEditRequestViewDom } from '../../mock-nunjucks-dom-helper';

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('EditRequestView', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    jest.clearAllMocks();
  });

  it('returns early when module has no config', () => {
    const module = document.createElement('div');
    expect(() => new EditRequestView(module)).not.toThrow();
  });

  it('does not fail when submission form is missing', async () => {
    const { moduleElement, form } = await setupEditRequestViewDom();
    form.remove();

    expect(() => new EditRequestView(moduleElement)).not.toThrow();
  });

  it('shows an error when jointly agreed is not selected', async () => {
    const { moduleElement, form, errorMessage, formGroup } = await setupEditRequestViewDom();

    new EditRequestView(moduleElement);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(errorMessage.innerHTML).toContain('Select the confirmation checkbox');
    expect(formGroup.classList.contains('govuk-form-group--error')).toBe(true);
  });

  it('posts the submission payload when jointly agreed is selected', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (global as any).fetch = fetchMock;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { moduleElement, form } = await setupEditRequestViewDom({
      jointlyAgreed: true,
      editRequest: { id: '123', status: 'DRAFT', edit_instructions: [] },
    });

    new EditRequestView(moduleElement);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith('/edit-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        id: '123',
        status: 'SUBMITTED',
        edit_instructions: [],
        jointly_agreed: true,
      }),
    });
    errorSpy.mockRestore();
  });

  it('logs an error when the submission request fails', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('submission failed'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { moduleElement, form } = await setupEditRequestViewDom({
      jointlyAgreed: true,
      editRequest: { id: '123', status: 'DRAFT', edit_instructions: [] },
    });

    new EditRequestView(moduleElement);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
