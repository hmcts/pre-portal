import express from 'express';
import { Nunjucks } from '../../main/modules/nunjucks';

type EditInstruction = {
  start_of_cut: string;
  end_of_cut: string;
  reason: string;
  difference?: string;
};

let templateApp: express.Express | undefined;

function getTemplateApp(): express.Express {
  if (!templateApp) {
    templateApp = express();
    new Nunjucks(false).enableFor(templateApp);
  }
  return templateApp;
}

async function renderTemplate(template: string, context: Record<string, unknown>): Promise<string> {
  const app = getTemplateApp();
  return new Promise((resolve, reject) => {
    app.render(
      template,
      {
        dynatrace_jstag: '',
        isSuperUser: false,
        pageUrl: '',
        ...context,
      },
      (error, html) => {
        if (error || !html) {
          reject(error || new Error(`Failed to render template: ${template}`));
          return;
        }
        resolve(html);
      }
    );
  });
}

function mountHtmlInDom(html: string): void {
  // JSDOM logs parse errors for nested SCSS-like inline style blocks in templates.
  const sanitizedHtml = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  const parsed = new window.DOMParser().parseFromString(sanitizedHtml, 'text/html');
  document.documentElement.innerHTML = parsed.documentElement.innerHTML;
}

export async function setupEditRequestManagerDom(editInstructions: EditInstruction[] = []): Promise<{
  moduleElement: HTMLElement;
  addButton: HTMLButtonElement;
  submitButton: HTMLButtonElement;
  editRow: HTMLTableRowElement;
  startInput: HTMLInputElement;
  endInput: HTMLInputElement;
  reasonInput: HTMLInputElement;
}> {
  const html = await renderTemplate('edit-request', {
    recording: {
      id: 'recording-1',
      case_reference: 'CASE-123',
    },
    editRequest: {
      id: '123',
      status: 'DRAFT',
      edit_instructions: editInstructions,
    },
    editRequestPostUrl: '/edit-request',
    mediaKindPlayerKey: 'test-key',
    recordingPlaybackDataUrl: '/recording/playback',
  });

  mountHtmlInDom(html);

  return {
    moduleElement: document.querySelector('[data-module="edit-request"]') as HTMLElement,
    addButton: document.querySelector('[data-edit-action="add"]') as HTMLButtonElement,
    submitButton: document.getElementById('submit-button') as HTMLButtonElement,
    editRow: document.getElementById('new-edit-reference-row') as HTMLTableRowElement,
    startInput: document.getElementById('start-time-input') as HTMLInputElement,
    endInput: document.getElementById('end-time-input') as HTMLInputElement,
    reasonInput: document.getElementById('reason-input') as HTMLInputElement,
  };
}

export async function setupEditRequestViewDom(
  options: {
    jointlyAgreed?: 'yes' | 'no';
    editRequest?: Record<string, unknown>;
  } = {}
): Promise<{
  moduleElement: HTMLElement;
  form: HTMLFormElement;
  yesRadio: HTMLInputElement;
  noRadio: HTMLInputElement;
  errorMessage: HTMLElement;
  formGroup: HTMLElement;
}> {
  const { jointlyAgreed, editRequest = { id: '123', status: 'DRAFT', edit_instructions: [] } } = options;

  const html = await renderTemplate('edit-request-view', {
    recording: {
      id: 'recording-1',
      case_reference: 'CASE-123',
    },
    editRequest,
    postUrl: '/edit-request',
  });

  mountHtmlInDom(html);

  const yesRadio = document.getElementById('jointlyAgreed-yes') as HTMLInputElement;
  const noRadio = document.getElementById('jointlyAgreed-no') as HTMLInputElement;

  if (jointlyAgreed === 'yes') {
    yesRadio.checked = true;
  }

  if (jointlyAgreed === 'no') {
    noRadio.checked = true;
  }

  return {
    moduleElement: document.querySelector('[data-module="edit-request-view"]') as HTMLElement,
    form: document.querySelector('form[data-edit-submission]') as HTMLFormElement,
    yesRadio,
    noRadio,
    errorMessage: document.getElementById('error-message') as HTMLElement,
    formGroup: document.getElementById('form-group') as HTMLElement,
  };
}
