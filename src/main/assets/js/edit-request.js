let errors = {};
let selectedIndex;

const newEditReference = () => {
  const row = document.getElementById('new-edit-reference-row');
  row.hidden = false;
}

const showErrors = () => {
  if (Object.keys(errors).length === 0) {
    return;
  }

  const startFormGroup = document.getElementById('start-form-group');
  const el = startFormGroup.querySelector('.govuk-error-message');
  if (el) {
    el.remove();
  }
  const endFormGroup = document.getElementById('end-form-group');
  const el2 = endFormGroup.querySelector('.govuk-error-message');
  if (el2) {
    el2.remove();
  }

  if (errors['startTime']) {
    startFormGroup.classList.add('govuk-form-group--error');
    const startTimeInput = document.getElementById('start-time-input');
    startTimeInput.classList.add('govuk-input--error');
    startTimeInput.insertAdjacentHTML('beforebegin', `<p class="govuk-error-message">
          <span class="govuk-visually-hidden">Error:</span> ${ errors['startTime']}`);
  } else {
    startFormGroup.classList.remove('govuk-form-group--error');
    const startTimeInput = document.getElementById('start-time-input');
    startTimeInput.classList.remove('govuk-input--error');
  }

  if (errors['endTime']) {
    endFormGroup.classList.add('govuk-form-group--error');
    const endTimeInput = document.getElementById('end-time-input');
    endTimeInput.classList.add('govuk-input--error');
    endTimeInput.insertAdjacentHTML('beforebegin', `<p class="govuk-error-message">
          <span class="govuk-visually-hidden">Error:</span> ${ errors['endTime']}`);
  } else {
    endFormGroup.classList.remove('govuk-form-group--error');
    const endTimeInput = document.getElementById('end-time-input');
    endTimeInput.classList.remove('govuk-input--error');
  }
};

const onSubmit = () => {
  window.location.href = "/edit-request/{{ recording.id }}/view";
};

const saveEditReference = (newEditRequest) => {
  const form = document.getElementById('new-edit-reference-form');
  const formData = new FormData(form);
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const reason = formData.get('reason');

  const row = document.getElementById('new-edit-reference-row');

  errors = {};

  fetch("{{ editRequestPostUrl }}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(
      newEditRequest
        ? newEditRequest
        : {
          ...editRequest,
          edit_instructions: [
            ...editRequest.edit_instructions,
            {
              start_of_cut: startTime,
              end_of_cut: endTime,
              reason,
            }
          ]
        }),
  }).then(async (response) => {
    if (!response.ok) {
      const e = (await response.json())['errors'];
      if (e) {
        errors = e;
        return;
      }
      throw new Error(response);
    }
    // refreshTable(await response.json());
  }).catch(e => {
    console.error("Error:", e);
  }).then(() => {
    if (Object.keys(errors).length > 0) {
      showErrors();
      return;
    }
    row.hidden = true;
    form.reset();
  });
};

const refreshTable = (content) => {
  editRequest = content;
  const currentInstructions = document.getElementById('current-instructions');
  currentInstructions.innerHTML = `
        <tr class="govuk-table__row" id="new-edit-reference-row" hidden>
          <td class="govuk-table__cell" style="vertical-align: bottom;">
            <label hidden for="start-time-input">Start Time</label>
            <div id="start-form-group">
              <input class="govuk-input govuk-input--width-10" id="start-time-input" name="startTime" type="text" placeholder="HH:MM:SS">
            </div>
          </td>
          <td class="govuk-table__cell" style="vertical-align: bottom;">
            <label hidden for="end-time-input">End Time</label>
            <div id="end-form-group">
              <input class="govuk-input govuk-input--width-10" id="end-time-input" name="endTime" type="text" placeholder="HH:MM:SS">
            </div>
          </td>
          <td class="govuk-table__cell" style="vertical-align: bottom;"></td>
          <td class="govuk-table__cell" style="vertical-align: bottom;">
            <label hidden for="reason-input">Reason</label>
            <div id="reason-form-group">
              <input class="govuk-input govuk-input--width-10" id="reason-input" name="reason" type="text" placeholder="Reason">
            </div>
          </td>
          <td class="govuk-table__cell" style="text-align: right;">
            <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#new-edit-reference-row" id="save-button" onclick="saveEditReference()">
              Save
            </button>
          </td>
          <td class="govuk-table__cell">
            <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#new-edit-reference-row" onclick="cancelEditReference()">
              Cancel
            </button>
          </td>
        </tr>` + content.edit_instructions.map((instruction, index) => {
    if (index === selectedIndex) {
      return '';
    }
    return `<tr id="instruction-${ index }" class="govuk-table__row">
            <td class="govuk-table__cell">${ instruction.start_of_cut }</td>
            <td class="govuk-table__cell">${ instruction.end_of_cut }</td>
            <td class="govuk-table__cell">${ instruction.difference }</td>
            <td class="govuk-table__cell">${ instruction.reason }</td>
            <td class="govuk-table__cell" style="text-align: right;">
              <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#new-edit-reference-row" onclick="selectRow(${ index }, true, ${ instruction })">
                Update
              </button>
            </td>
            <td class="govuk-table__cell">
              <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#delete-reference-row" onclick="selectRow(${ index }, false, ${ instruction })">
                Delete
              </button>
            </td>
          </tr>`;
  }).join('');
};

const cancelEditReference = () => {
  // editRequest = JSON.parse("{{ editRequest | dump  }}".replace(/&quot;/g, '"'))
  const row = document.getElementById('new-edit-reference-row');
  const form = document.getElementById('new-edit-reference-form');
  row.hidden = true;
  form.reset();
  errors = {};
  selectedIndex = undefined;
  // refreshTable(editRequest);
};

const selectRow = (id, isUpdate, instruction) => {
  selectedIndex = id;
  // refreshTable(editRequest);
  const row = document.getElementById('new-edit-reference-row');
  const currentInstructions = document.getElementById('current-instructions');
  if (isUpdate) {
    // is update
    row.hidden = false;
    const saveButton = document.getElementById('save-button');
    saveButton.removeAttribute('onclick');
    saveButton.addEventListener('click', _ => {
      updateEditReference(id);
    });
    const startInput = document.getElementById('start-time-input');
    startInput.value = instruction.start_of_cut;
    const endInput = document.getElementById('end-time-input');
    endInput.value = instruction.end_of_cut;
    const reasonInput = document.getElementById('reason-input');
    reasonInput.value = instruction.reason;
  } else {
    const row = document.getElementById('new-edit-reference-row');
    row.hidden = true;
    // is delete
    const display = `
          <tr class="govuk-table__row delete-message-block" id="delete-reference-row">
            <td class="govuk-table__cell" style="vertical-align: bottom;">
              <div class="delete-message-block">
                <p class="govuk-error-message">Please confirm to delete this edit reference</p>
                <label hidden for="start-time-input">Start Time</label>
                <div id="start-form-group">
                  <input class="govuk-input govuk-input--width-10" id="start-time-input" name="startTime" type="text" placeholder="HH:MM:SS" disabled value="${ instruction.start_of_cut }">
                </div>
              </div>
            </td>
            <td class="govuk-table__cell" style="vertical-align: bottom;">
              <label hidden for="end-time-input">End Time</label>
              <div id="end-form-group">
                <input class="govuk-input govuk-input--width-10" id="end-time-input" name="endTime" type="text" placeholder="HH:MM:SS" disabled value="${ instruction.end_of_cut }">
              </div>
            </td>
            <td class="govuk-table__cell" style="vertical-align: bottom; opacity: 0.5;">${ instruction.difference }</td>
            <td class="govuk-table__cell" style="vertical-align: bottom;">
              <label hidden for="reason-input">Reason</label>
              <div id="reason-form-group">
                <input class="govuk-input govuk-input--width-10" id="reason-input" name="reason" type="text" placeholder="Reason" disabled value="${ instruction.reason }">
              </div>
            </td>
            <td class="govuk-table__cell" style="text-align: right;">
              <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#new-edit-reference-form" onclick="deleteEditReference(${selectedIndex}, ${ editRequest })">
                Confirm
              </button>
            </td>
            <td class="govuk-table__cell">
              <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button" href="#new-edit-reference-form" onclick="cancelEditReference()">
                Cancel
              </button>
            </td>
          </tr>`;
    currentInstructions.innerHTML = display + currentInstructions.innerHTML;
  }
};

const updateEditReference = (id) => {
  const newEditRequest = {
    ...editRequest,
    edit_instructions: editRequest.edit_instructions.map((instruction, index) => {
      if (index === id) {
        return {
          start_of_cut: document.getElementById('start-time-input').value,
          end_of_cut: document.getElementById('end-time-input').value,
          reason: document.getElementById('reason-input').value
        };
      }
      return instruction;
    })
  };

  saveEditReference(newEditRequest);
  selectedIndex = undefined;
};

const deleteEditReference = (id, editRequest) => {
  editRequest.edit_instructions.splice(id, 1);
  saveEditReference(editRequest);
  selectedIndex = undefined;
};
