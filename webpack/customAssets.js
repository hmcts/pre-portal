const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const root = path.resolve(__dirname, '../src/main/assets');
const images = path.resolve(root, 'images');
const files = path.resolve(root, 'files');

const loadingSpinner = path.resolve(images, 'loading-spinner.gif');
const faqs = path.resolve(files, 'faqs.pdf');
const processGuide = path.resolve(files, 'process-guide.pdf');
const userGuide = path.resolve(files, 'user-guide.pdf');
const editingRequestForm = path.resolve(files, 'pre-editing-request-form.xlsx');

const copyCustomAssets = new CopyWebpackPlugin({
  patterns: [
    { from: loadingSpinner, to: 'assets/images' },
    { from: faqs, to: 'assets/files' },
    { from: processGuide, to: 'assets/files' },
    { from: userGuide, to: 'assets/files' },
    { from: editingRequestForm, to: 'assets/files' },
  ],
});

module.exports = {
  paths: { template: root },
  plugins: [copyCustomAssets],
};
