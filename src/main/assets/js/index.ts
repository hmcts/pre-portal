import '../scss/main.scss';
import { initAll } from 'govuk-frontend';
import './cookie.js';
import { EditRequestManager } from './edit-request';
import { EditRequestView } from './edit-request-view';

initAll();

export const editRequestManagers = Array.from(
  document.querySelectorAll('[data-module="edit-request"]'),
  element => new EditRequestManager(element as HTMLElement)
);

export const editRequestViews = Array.from(
  document.querySelectorAll('[data-module="edit-request-view"]'),
  element => new EditRequestView(element as HTMLElement)
);
