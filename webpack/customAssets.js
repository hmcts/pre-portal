import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '../src/main/assets');
const images = path.resolve(root, 'images');
const files = path.resolve(root, 'files');

const loadingSpinner = path.resolve(images, 'loading-spinner.gif');
const faqs = path.resolve(files, 'faqs.pdf');
const processGuide = path.resolve(files, 'process-guide.pdf');
const userGuide = path.resolve(files, 'user-guide.pdf');
const editingRequestForm = path.resolve(files, 'pre-editing-request-form.xlsx');

export default {
  paths: { template: root },
  patterns: [
    { from: loadingSpinner, to: 'assets/images' },
    { from: faqs, to: 'assets/files' },
    { from: processGuide, to: 'assets/files' },
    { from: userGuide, to: 'assets/files' },
    { from: editingRequestForm, to: 'assets/files' },
  ],
};
