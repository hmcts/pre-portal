export class EditRequestView {
  private editRequest: any;
  private postUrl!: string;

  constructor($module: HTMLElement) {
    const configData = $module.getAttribute('data-config');
    if (!configData) {
      return;
    }

    const config = JSON.parse(configData);
    this.editRequest = config.editRequest;
    this.postUrl = config.postUrl;

    const form = document.querySelector('form[data-edit-submission]') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', e => this.onSubmit(e));
    }
  }

  private onError = () => {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.innerHTML = '<span class="govuk-visually-hidden">Error:</span> Select an option';
    }

    const formGroup = document.getElementById('form-group');
    if (formGroup) {
      formGroup.classList.add('govuk-form-group--error');
    }
  };

  private onSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const jointlyAgreed = formData.get('jointlyAgreed');

    if (!jointlyAgreed) {
      this.onError();
      return;
    }

    fetch(this.postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        ...this.editRequest,
        jointly_agreed: jointlyAgreed === 'yes',
        status: 'SUBMITTED',
      }),
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(response as any);
        }
        window.location.href = '/browse';
      })
      .catch(error => {
        console.error(error);
      });
  };
}
