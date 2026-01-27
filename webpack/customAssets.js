const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const root = path.resolve(__dirname, '../src/main/assets');
const images = path.resolve(root, 'images');
const rebrandIcons = path.resolve(root, 'rebrand/images');
const files = path.resolve(root, 'files');
const customJs = path.resolve(root, 'js');

const loadingSpinner = path.resolve(images, 'loading-spinner.gif');
const favicon = path.resolve(rebrandIcons, 'favicon.svg')
const icon180 = path.resolve(rebrandIcons, 'govuk-icon-180.png')
const faqs = path.resolve(files, 'faqs.pdf');
const processGuide = path.resolve(files, 'process-guide.pdf');
const userGuide = path.resolve(files, 'user-guide.pdf');
const editingRequestForm = path.resolve(files, 'pre-editing-request-form.xlsx');
const editingRequestJs = path.resolve(customJs, 'edit-request.js')

const copyCustomAssets = new CopyWebpackPlugin({
  patterns: [
    { from: loadingSpinner, to: 'assets/images' },
    { from: favicon, to: 'assets/images' },
    { from: icon180, to: 'assets/images' },
    { from: loadingSpinner, to: 'assets/images' },
    { from: faqs, to: 'assets/files' },
    { from: processGuide, to: 'assets/files' },
    { from: userGuide, to: 'assets/files' },
    { from: editingRequestForm, to: 'assets/files' },
    { from: editingRequestJs, to: 'assets/js'}
  ],
});

module.exports = {
  paths: { template: root },
  plugins: [copyCustomAssets],
};
