import '../scss/main.scss';
import { initAll } from 'govuk-frontend';
import './cookie.js';
import { EditRequestManager } from './edit-request';
import { EditRequestView } from './edit-request-view';

initAll();

document.querySelectorAll('[data-module="edit-request"]').forEach((element) => {
  new EditRequestManager(element as HTMLElement);
});

document.querySelectorAll('[data-module="edit-request-view"]').forEach((element) => {
  new EditRequestView(element as HTMLElement);
});

