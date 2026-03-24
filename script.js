'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ─── Element refs ────────────────────────────────────────────────────────
    const spinner          = document.getElementById('spinner');
    const requestsTable    = document.getElementById('requests-table');
    const typeOfRequestSelect = document.getElementById('typeOfRequest');
    const printButton      = document.getElementById('printButton');
    const statusMessage    = document.getElementById('status-message');

    if (!spinner || !requestsTable || !typeOfRequestSelect || !printButton) {
        console.error('script.js: one or more required DOM elements are missing.');
        return;
    }

    // Ensure tbody exists
    let requestsTableBody = requestsTable.querySelector('tbody');
    if (!requestsTableBody) {
        requestsTableBody = document.createElement('tbody');
        requestsTable.appendChild(requestsTableBody);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Announce a message to screen readers via the live region. */
    function announce(message, isError = false) {
        statusMessage.textContent = '';          // reset so same message re-announces
        statusMessage.classList.remove('visually-hidden', 'status-error', 'status-success');
        statusMessage.classList.add(isError ? 'status-error' : 'status-success');
        // Slight delay ensures the DOM change is picked up by the live region
        requestAnimationFrame(() => {
            statusMessage.textContent = message;
        });
    }

    function capitalizeWords(str) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${month}-${day}-${year}`;
    }

    // ─── Populate prayer-type dropdown ───────────────────────────────────────

    function updatePrayerTypes(types) {
        const fragment = document.createDocumentFragment();
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = capitalizeWords(type);
            option.textContent = capitalizeWords(type);
            fragment.appendChild(option);
        });
        typeOfRequestSelect.innerHTML = '';
        typeOfRequestSelect.appendChild(fragment);
    }

    // ─── Render prayer-request rows ──────────────────────────────────────────

    /**
     * Builds the table header row exactly once, so screen readers can
     * associate every data cell with its column header via scope="col".
     */
    function renderTableHeader() {
        const thead = requestsTable.querySelector('thead');
        thead.innerHTML = `
            <tr>
                <th scope="col" class="visually-hidden">Select to update</th>
                <th scope="col">Type</th>
                <th scope="col">Request Details</th>
            </tr>
        `;
    }

    /**
     * Renders all prayer-request rows into tbody.
     * Each date group gets a visible group header row for sighted users AND
     * an aria-label on each row that includes the date for screen reader users.
     */
    function renderRequests(data) {
        renderTableHeader();

        const fragment = document.createDocumentFragment();
        let currentDate = '';

        data.forEach(request => {
            const rawDate   = request.DateOfUpdate || request.DateOfRequest;
            const formatted = formatDate(rawDate);

            // ── Date separator row ──────────────────────────────────────────
            if (formatted !== currentDate) {
                currentDate = formatted;
                const dateRow = document.createElement('tr');
                dateRow.setAttribute('role', 'rowgroup');   // purely visual grouping
                // aria-hidden: the date is already spoken as part of each data row's aria-label
                dateRow.setAttribute('aria-hidden', 'true');
                dateRow.innerHTML = `
                    <td colspan="3">
                        <b class="date-header">${formatted}</b>
                    </td>
                `;
                fragment.appendChild(dateRow);
            }

            // ── Build the update-text snippet ───────────────────────────────
            let updateText        = '';
            let updateAnnounce    = '';
            if (request.UpdateToRequest) {
                const updateDate  = formatDate(request.DateOfUpdate);
                updateText        = `<span class="highlighted-date"> – Updated: ${updateDate}</span> ${request.UpdateToRequest}`;
                updateAnnounce    = ` Updated on ${updateDate}: ${request.UpdateToRequest}`;
            }

            const fullName    = `${request.FirstName} ${request.LastName}`;
            const reqType     = capitalizeWords(request.TypeOfRequest);

            // ── Data row ────────────────────────────────────────────────────
            const requestRow  = document.createElement('tr');
            requestRow.classList.add('request-row');
            /*
             * aria-label on the row gives screen reader users the full sentence
             * they need without having to navigate cell-by-cell.
             */
            requestRow.setAttribute('aria-label',
                `${reqType} request from ${fullName} dated ${formatted}: ${request.InitialRequest}${updateAnnounce}`
            );

            requestRow.innerHTML = `
                <td valign="top">
                    <input
                        type="checkbox"
                        name="updateRequest"
                        value="${request.Id}"
                        class="update-checkbox"
                        id="checkbox-${request.Id}"
                        aria-label="Select to update ${reqType} request from ${fullName}"
                        aria-controls="updateForm-${request.Id}"
                        aria-expanded="false"
                    >
                </td>
                <td class="request-type" headers="col-type">
                    <span aria-hidden="true">${reqType}:</span>
                </td>
                <td class="request-text" headers="col-details">
                    <span aria-hidden="true">${fullName}: ${request.InitialRequest}${updateText}</span>
                </td>
            `;
            fragment.appendChild(requestRow);

            // ── Update form row (hidden until checkbox checked) ─────────────
            const updateFormRow = document.createElement('tr');
            updateFormRow.classList.add('update-form-row');
            updateFormRow.innerHTML = `
                <td colspan="3" valign="top">
                    <form
                        class="update-form"
                        id="updateForm-${request.Id}"
                        aria-label="Update prayer request for ${fullName}"
                        aria-describedby="update-instructions-${request.Id}"
                        style="display:none"
                        novalidate
                    >
                        <p id="update-instructions-${request.Id}" class="visually-hidden">
                            Enter your update for ${fullName}'s ${reqType} prayer request, then press the Update button.
                        </p>
                        <input type="hidden" name="updateId" value="${request.Id}">
                        <div class="form-group">
                            <label for="updateToRequest-${request.Id}">Update text</label>
                            <textarea
                                id="updateToRequest-${request.Id}"
                                name="updateToRequest"
                                rows="3"
                                required
                                aria-required="true"
                                placeholder="Enter the update for this request…"
                            ></textarea>
                        </div>
                        <button type="submit">Update Prayer Request</button>
                    </form>
                </td>
            `;
            fragment.appendChild(updateFormRow);
        });

        requestsTableBody.innerHTML = '';
        requestsTableBody.appendChild(fragment);

        // ── Checkbox toggle: show/hide update form ──────────────────────────
        requestsTableBody.addEventListener('change', (event) => {
            if (!event.target.classList.contains('update-checkbox')) return;

            const checkbox     = event.target;
            const selectedForm = document.getElementById(`updateForm-${checkbox.value}`);

            // Close any other open forms first
            document.querySelectorAll('.update-checkbox').forEach(other => {
                if (other !== checkbox) {
                    other.checked = false;
                    other.setAttribute('aria-expanded', 'false');
                    const otherForm = document.getElementById(`updateForm-${other.value}`);
                    if (otherForm) otherForm.style.display = 'none';
                }
            });

            if (checkbox.checked) {
                selectedForm.style.display = 'block';
                checkbox.setAttribute('aria-expanded', 'true');
                // Move focus into the textarea so keyboard/screen reader users
                // don't have to tab all the way down to it
                const textarea = selectedForm.querySelector('textarea');
                if (textarea) textarea.focus();
            } else {
                selectedForm.style.display = 'none';
                checkbox.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ─── Fetch & display requests ────────────────────────────────────────────

    spinner.style.display = 'block';
    spinner.removeAttribute('aria-hidden');

    fetch('/api/prayer-requests')
        .then(res => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then(data => {
            spinner.style.display = 'none';
            spinner.setAttribute('aria-hidden', 'true');

            const prayerTypes = [...new Set(data.map(r => r.TypeOfRequest.toLowerCase()))];
            updatePrayerTypes(prayerTypes);

            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                if (dateB - dateA !== 0) return dateB - dateA;
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });

            renderRequests(data);
            announce(`${data.length} prayer request${data.length !== 1 ? 's' : ''} loaded.`);
        })
        .catch(error => {
            spinner.style.display = 'none';
            spinner.setAttribute('aria-hidden', 'true');
            console.error('Error fetching prayer requests:', error);
            announce('Error loading prayer requests. Please refresh the page and try again.', true);
        });

    // ─── Create new prayer request ───────────────────────────────────────────

    const newRequestForm   = document.getElementById('newRequestForm');
    const submitButton     = document.getElementById('createNewRequest');

    submitButton.addEventListener('click', (event) => {
        event.preventDefault();

        const formData = new FormData(newRequestForm);
        const data     = Object.fromEntries(formData.entries());

        // Basic client-side check so we give useful feedback before hitting the server
        if (!data.firstName || !data.lastName || !data.dateOfRequest || !data.typeOfRequest || !data.initialRequest) {
            announce('Please fill in all required fields before submitting.', true);
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting…';

        fetch('/api/create-prayer-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then(() => {
            newRequestForm.reset();
            submitButton.disabled    = false;
            submitButton.textContent = 'Submit Prayer Request';
            announce(`Prayer request for ${data.firstName} ${data.lastName} submitted successfully.`);
            // Reload data without a full page reload
            return fetch('/api/prayer-requests').then(r => r.json());
        })
        .then(data => {
            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                if (dateB - dateA !== 0) return dateB - dateA;
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });
            renderRequests(data);
        })
        .catch(error => {
            console.error('Error creating prayer request:', error);
            submitButton.disabled    = false;
            submitButton.textContent = 'Submit Prayer Request';
            announce('Error submitting prayer request. Please try again.', true);
        });
    });

    // ─── Update existing prayer request ──────────────────────────────────────

    document.addEventListener('submit', (event) => {
        if (!event.target.classList.contains('update-form')) return;
        event.preventDefault();

        const form        = event.target;
        const formData    = new FormData(form);
        const data        = Object.fromEntries(formData.entries());
        const dateOfUpdate = new Date().toISOString().split('T')[0];

        const updateBtn   = form.querySelector('button[type="submit"]');
        updateBtn.disabled    = true;
        updateBtn.textContent = 'Saving…';

        fetch(`/api/update-prayer-request/${data.updateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Id: data.updateId,
                UpdateToRequest: data.updateToRequest,
                DateOfUpdate: dateOfUpdate
            })
        })
        .then(res => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then(() => {
            form.reset();
            updateBtn.disabled    = false;
            updateBtn.textContent = 'Update Prayer Request';
            announce('Prayer request updated successfully.');
            // Reload data without a full page reload
            return fetch('/api/prayer-requests').then(r => r.json());
        })
        .then(data => {
            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                if (dateB - dateA !== 0) return dateB - dateA;
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });
            renderRequests(data);
        })
        .catch(error => {
            console.error('Error updating prayer request:', error);
            updateBtn.disabled    = false;
            updateBtn.textContent = 'Update Prayer Request';
            announce('Error saving update. Please try again.', true);
        });
    });

    // ─── Print ───────────────────────────────────────────────────────────────

    printButton.addEventListener('click', () => {
        const table = document.getElementById('requests-table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        let tableHTML = '<table><thead>' + (table.querySelector('thead')?.innerHTML || '') + '</thead><tbody>';
        rows.forEach(row => {
            const newRow = row.cloneNode(true);
            newRow.querySelectorAll('input[type="checkbox"], form, .visually-hidden').forEach(el => el.remove());
            tableHTML += newRow.outerHTML;
        });
        tableHTML += '</tbody></table>';

        const newWindow = window.open('', '', 'width=800,height=600');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Prayer Requests</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; text-align: left; border: none; vertical-align: top; }
                    th { background-color: #f2f2f2; }
                    .date-header { font-weight: bold; }
                    .request-type { color: #006400; font-weight: bold; font-size: smaller; white-space: nowrap; }
                    .highlighted-date { color: #4507ee; font-size: smaller; }
                </style>
            </head>
            <body>${tableHTML}</body>
            </html>
        `);
        newWindow.document.close();
        newWindow.print();
        newWindow.close();
    });

});
