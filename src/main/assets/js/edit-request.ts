class InstructionPayloadBuilder {
  constructor(
    private editRequest: any,
    private form: HTMLFormElement
  ) {}

  buildAddPayload(): any {
    const { startTime, endTime, reason } = this.getFormValues();
    return {
      ...this.editRequest,
      edit_instructions: [
        ...this.editRequest.edit_instructions,
        { start_of_cut: startTime, end_of_cut: endTime, reason },
      ],
    };
  }

  buildUpdatePayload(index: number): any {
    const { startTime, endTime, reason } = this.getFormValues();
    const newInstructions = this.editRequest.edit_instructions.map((inst: any, i: number) => {
      if (i === index) {
        return { start_of_cut: startTime, end_of_cut: endTime, reason };
      }
      const { _id, ...cleaned } = inst;
      return cleaned;
    });
    return { ...this.editRequest, edit_instructions: newInstructions };
  }

  buildDeletePayload(index: number): any {
    const newInstructions = this.editRequest.edit_instructions
      .filter((_: any, i: number) => i !== index)
      .map((inst: any) => {
        const { _id, ...cleaned } = inst;
        return cleaned;
      });
    return { ...this.editRequest, edit_instructions: newInstructions };
  }

  private getFormValues(): any {
    const formData = new FormData(this.form);
    return {
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      reason: formData.get('reason'),
    };
  }
}

class ApiService {
  private errors: any = {};

  constructor(private postUrl: string) {}

  async submit(payload: any): Promise<any> {
    this.errors = {};
    try {
      const response = await fetch(this.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.errors) {
          this.errors = data.errors;
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  getErrors(): any {
    return this.errors;
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}

class UIRenderer {
  renderInstructions(instructions: any[], selectedIndex?: number): string {
    return instructions
      .map((inst, index) => {
        if (index === selectedIndex) return '';
        return `<tr id="instruction-${index}" class="govuk-table__row">
          <td class="govuk-table__cell">${inst.start_of_cut}</td>
          <td class="govuk-table__cell">${inst.end_of_cut}</td>
          <td class="govuk-table__cell">${inst.difference || ''}</td>
          <td class="govuk-table__cell" style="overflow-wrap: break-word;">${inst.reason}</td>
          <td class="govuk-table__cell" style="text-align: right;">
            <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="update" data-index="${index}">Update</button>
          </td>
          <td class="govuk-table__cell">
            <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="delete" data-index="${index}">Delete</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  renderEditForm(): string {
    return `<tr class="govuk-table__row" id="new-edit-reference-row" hidden>
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <label hidden for="start-time-input">Start Time</label>
        <div id="start-form-group"><input class="govuk-input govuk-input--width-10" id="start-time-input" name="startTime" type="text" placeholder="HH:MM:SS"></div>
      </td>
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <label hidden for="end-time-input">End Time</label>
        <div id="end-form-group"><input class="govuk-input govuk-input--width-10" id="end-time-input" name="endTime" type="text" placeholder="HH:MM:SS"></div>
      </td>
      <td class="govuk-table__cell"></td>
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <label hidden for="reason-input">Reason</label>
        <div id="reason-form-group"><input class="govuk-input govuk-input--width-10" id="reason-input" name="reason" type="text" placeholder="Reason"></div>
      </td>
      <td class="govuk-table__cell" style="text-align: right;">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="save">Save</button>
      </td>
      <td class="govuk-table__cell">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="cancel">Cancel</button>
      </td>
    </tr>`;
  }

  renderDeleteConfirmation(instruction: any, index: number): string {
    return `<tr class="govuk-table__row delete-message-block" id="delete-reference-row">
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <div class="delete-message-block">
          <p class="govuk-error-message">Please confirm to delete this edit reference</p>
          <div id="start-form-group"><input class="govuk-input govuk-input--width-10" id="start-time-input" name="startTime" type="text" placeholder="HH:MM:SS" disabled value="${instruction.start_of_cut}"></div>
        </div>
      </td>
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <div id="end-form-group"><input class="govuk-input govuk-input--width-10" id="end-time-input" name="endTime" type="text" placeholder="HH:MM:SS" disabled value="${instruction.end_of_cut}"></div>
      </td>
      <td class="govuk-table__cell" style="vertical-align: bottom; opacity: 0.5;">${instruction.difference || ''}</td>
      <td class="govuk-table__cell" style="vertical-align: bottom;">
        <div id="reason-form-group"><input class="govuk-input govuk-input--width-10" id="reason-input" name="reason" type="text" placeholder="Reason" disabled value="${instruction.reason}"></div>
      </td>
      <td class="govuk-table__cell" style="text-align: right;">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="confirm-delete" data-index="${index}">Confirm</button>
      </td>
      <td class="govuk-table__cell">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-edit-action="cancel-delete">Cancel</button>
      </td>
    </tr>`;
  }

  showErrors(errors: any): void {
    this.clearAllErrors();
    if (errors['overlap']) {
      this.showErrorSummary(errors['overlap']);
      return;
    }

    const startFormGroup = document.getElementById('start-form-group') as HTMLElement;
    const startTimeInput = document.getElementById('start-time-input') as HTMLInputElement;

    if (startFormGroup && startTimeInput) {
      const existingError = startFormGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }

      startFormGroup.classList.remove('govuk-form-group--error');
      startTimeInput.classList.remove('govuk-input--error');

      if (errors['startTime']) {
        startFormGroup.classList.add('govuk-form-group--error');
        startTimeInput.classList.add('govuk-input--error');

        const errorHTML = `<p class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ${errors['startTime']}</p>`;
        startTimeInput.insertAdjacentHTML('beforebegin', errorHTML);
      }
    }

    const endFormGroup = document.getElementById('end-form-group') as HTMLElement;
    const endTimeInput = document.getElementById('end-time-input') as HTMLInputElement;

    if (endFormGroup && endTimeInput) {
      const existingError = endFormGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }

      endFormGroup.classList.remove('govuk-form-group--error');
      endTimeInput.classList.remove('govuk-input--error');

      if (errors['endTime']) {
        endFormGroup.classList.add('govuk-form-group--error');
        endTimeInput.classList.add('govuk-input--error');

        const errorHTML = `<p class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ${errors['endTime']}</p>`;
        endTimeInput.insertAdjacentHTML('beforebegin', errorHTML);
      }
    }
  }

  showErrorSummary(message: string): void {
    const errorSummary = document.getElementById('validation-error-summary');
    const errorList = document.getElementById('validation-error-list');

    if (!errorSummary || !errorList) {
      return;
    }

    errorList.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = message;
    errorList.appendChild(li);

    errorSummary.style.display = 'block';
    errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  hideErrorSummary(): void {
    const errorSummary = document.getElementById('validation-error-summary');
    if (errorSummary) {
      errorSummary.style.display = 'none';
    }
  }

  clearAllErrors(): void {
    this.hideErrorSummary();

    const startFormGroup = document.getElementById('start-form-group') as HTMLElement;
    const startTimeInput = document.getElementById('start-time-input') as HTMLInputElement;

    if (startFormGroup && startTimeInput) {
      const existingError = startFormGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }
      startFormGroup.classList.remove('govuk-form-group--error');
      startTimeInput.classList.remove('govuk-input--error');
    }

    const endFormGroup = document.getElementById('end-form-group') as HTMLElement;
    const endTimeInput = document.getElementById('end-time-input') as HTMLInputElement;

    if (endFormGroup && endTimeInput) {
      const existingError = endFormGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }
      endFormGroup.classList.remove('govuk-form-group--error');
      endTimeInput.classList.remove('govuk-input--error');
    }
  }

  hideErrors(): void {
    this.clearAllErrors();
  }

  showSubmitError(): void {
    const errorSummary = document.getElementById('submit-error-summary');
    if (errorSummary) {
      errorSummary.style.display = 'block';
      errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  hideSubmitError(): void {
    const errorSummary = document.getElementById('submit-error-summary');
    if (errorSummary) {
      errorSummary.style.display = 'none';
    }
  }
}

export class EditRequestManager {
  private editRequest: any = {};
  private recordingId: string = '';
  private apiService!: ApiService;
  private payloadBuilder!: InstructionPayloadBuilder;
  private renderer: UIRenderer = new UIRenderer();
  private selectedIndex: number | undefined;
  private isSubmitting: boolean = false;

  constructor($module: HTMLElement) {
    const configData = $module.getAttribute('data-config');
    if (!configData) {
      return;
    }

    try {
      const config = JSON.parse(configData);
      this.editRequest = config.editRequest;
      this.recordingId = config.recordingId;
      this.apiService = new ApiService(config.postUrl);
      this.payloadBuilder = new InstructionPayloadBuilder(this.editRequest, this.getForm());
      this.init();
    } catch (error) {
      // Error during initialization
    }
  }

  private init(): void {
    this.bindFormSubmit();
    this.bindAddButton();
    this.bindSubmitButton();
  }

  private bindFormSubmit(): void {
    const form = this.getForm();
    if (!form) {
      return;
    }
    form.addEventListener('submit', e => {
      if (this.isSubmitting) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const submitter = (e as any).submitter;
      if (!submitter) {
        return;
      }
      const action = submitter.getAttribute('data-edit-action');
      const index = submitter.getAttribute('data-index') ? parseInt(submitter.getAttribute('data-index')) : undefined;
      this.handleAction(action, index);
    });
  }

  private bindAddButton(): void {
    const addBtn = document.querySelector('[data-edit-action="add"]');
    if (addBtn) {
      addBtn.addEventListener('click', e => {
        e.preventDefault();
        this.showForm();
      });
    }
  }

  private bindSubmitButton(): void {
    const submitBtn = document.getElementById('submit-button');
    if (submitBtn) {
      submitBtn.addEventListener('click', e => {
        if (!this.editRequest.edit_instructions || this.editRequest.edit_instructions.length === 0) {
          e.preventDefault();
          this.renderer.showSubmitError();
          return;
        }
        this.renderer.hideSubmitError();
        window.location.href = `/edit-request/${this.recordingId}/view`;
      });
    }
    this.updateSubmitButtonState();
  }

  private updateSubmitButtonState(): void {
    const submitBtn = document.getElementById('submit-button') as HTMLButtonElement | null;
    if (submitBtn) {
      const hasInstructions = this.editRequest.edit_instructions && this.editRequest.edit_instructions.length > 0;
      submitBtn.disabled = !hasInstructions;
    }
  }

  private handleAction(action: string, index?: number): void {
    switch (action) {
      case 'save':
        this.save();
        break;
      case 'cancel':
        this.cancel();
        break;
      case 'update':
        if (index !== undefined) {
          this.edit(index);
        }
        break;
      case 'delete':
        if (index !== undefined) {
          this.confirmDelete(index);
        }
        break;
      case 'confirm-delete':
        if (index !== undefined) {
          this.delete(index);
        }
        break;
      case 'cancel-delete':
        this.cancel();
        break;
    }
  }

  private showForm(): void {
    const row = document.getElementById('new-edit-reference-row') as HTMLElement;
    if (row) {
      row.hidden = false;
    }
    this.selectedIndex = undefined;
  }

  private save(): void {
    const payload =
      this.selectedIndex !== undefined
        ? this.payloadBuilder.buildUpdatePayload(this.selectedIndex)
        : this.payloadBuilder.buildAddPayload();
    this.submitPayload(payload);
  }

  private edit(index: number): void {
    this.selectedIndex = index;
    const instruction = this.editRequest.edit_instructions[index];
    if (!instruction) return;

    this.refreshTable();
    const row = document.getElementById('new-edit-reference-row') as HTMLElement;
    if (row) row.hidden = false;

    const startInput = document.getElementById('start-time-input') as HTMLInputElement;
    const endInput = document.getElementById('end-time-input') as HTMLInputElement;
    const reasonInput = document.getElementById('reason-input') as HTMLInputElement;

    if (startInput) startInput.value = instruction.start_of_cut;
    if (endInput) endInput.value = instruction.end_of_cut;
    if (reasonInput) reasonInput.value = instruction.reason;
  }

  private confirmDelete(index: number): void {
    this.selectedIndex = index;
    const instruction = this.editRequest.edit_instructions[index];
    if (!instruction) return;

    this.refreshTable();

    const rowToHide = document.getElementById(`instruction-${index}`);
    if (rowToHide) {
      rowToHide.remove();
    }

    const currentInstructions = document.getElementById('current-instructions') as HTMLElement;
    if (currentInstructions) {
      currentInstructions.innerHTML =
        this.renderer.renderDeleteConfirmation(instruction, index) + currentInstructions.innerHTML;
    }
  }

  private delete(index: number): void {

    const payload = this.payloadBuilder.buildDeletePayload(index);
    this.submitPayload(payload);
  }

  private cancel(): void {
    const row = document.getElementById('new-edit-reference-row') as HTMLElement;
    const form = this.getForm();

    if (row) row.hidden = true;
    if (form) form.reset();

    this.selectedIndex = undefined;
    this.refreshTable();
    this.renderer.hideErrors();
  }

  private async submitPayload(payload: any): Promise<void> {
    const form = this.getForm();

    this.setSubmitting(true);
    const result = await this.apiService.submit(payload);

    if (this.apiService.hasErrors()) {
      this.setSubmitting(false);
      const errors = this.apiService.getErrors();

      const row = document.getElementById('new-edit-reference-row') as HTMLElement;
      if (row && row.hidden) {
        row.hidden = false;
      }

      this.renderer.showErrors(errors);
      return;
    }

    if (result) {
      this.editRequest = result;
      this.payloadBuilder = new InstructionPayloadBuilder(this.editRequest, form);
      this.selectedIndex = undefined;
      this.refreshTable();
      const row = document.getElementById('new-edit-reference-row') as HTMLElement;
      if (row) row.hidden = true;
      if (form) form.reset();
      this.updateSubmitButtonState();
      this.renderer.hideErrors();
    }

    this.setSubmitting(false);
    this.selectedIndex = undefined;
  }

  private setSubmitting(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;
    const loadingEl = document.getElementById('edit-request-loading');
    if (loadingEl) {
      loadingEl.style.display = isSubmitting ? 'block' : 'none';
    }

    const form = this.getForm();
    if (form) {
      form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
      form.querySelectorAll('input, button').forEach(el => {
        const field = el as HTMLInputElement | HTMLButtonElement;
        field.disabled = isSubmitting;
      });
    }

    const addBtn = document.querySelector('[data-edit-action="add"]') as HTMLButtonElement | null;
    if (addBtn) {
      addBtn.disabled = isSubmitting;
    }

    const submitBtn = document.getElementById('submit-button') as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
    }
  }

  private refreshTable(): void {
    const currentInstructions = document.getElementById('current-instructions') as HTMLElement;
    if (!currentInstructions) return;

    const rows = this.renderer.renderInstructions(this.editRequest.edit_instructions, this.selectedIndex);
    currentInstructions.innerHTML = this.renderer.renderEditForm() + rows;
    this.updateSubmitButtonState();
    this.renderer.hideSubmitError();
  }

  private getForm(): HTMLFormElement {
    return document.getElementById('new-edit-reference-form') as HTMLFormElement;
  }
}
