document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const requestsTable = document.getElementById('requests-table');
    const typeOfRequestSelect = document.getElementById('typeOfRequest');
    const printButton = document.getElementById('printButton');

    // Function to capitalize the first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Function to update the prayer types dropdown
    function updatePrayerTypes(types) {
        typeOfRequestSelect.innerHTML = ''; // Clear existing options
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.toLowerCase();
            option.textContent = capitalizeWords(type);
            typeOfRequestSelect.appendChild(option);
        });
    }

    // Show spinner before fetching data
    spinner.style.display = 'block';

    // Fetch and display existing prayer requests
    fetch('/api/prayer-requests')
        .then(response => response.json())
        .then(data => {
            // Hide spinner after data is fetched
            spinner.style.display = 'none';

            // Extract unique prayer types
            const prayerTypes = [...new Set(data.map(request => request.TypeOfRequest.toLowerCase()))];
            updatePrayerTypes(prayerTypes);

            // Sort data by DateOfUpdate or DateOfRequest, newest first, then by TypeOfRequest
            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                if (dateB - dateA !== 0) {
                    return dateB - dateA;
                }
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });

 // Add this CSS to your stylesheet or within a <style> tag
const style = document.createElement('style');
style.innerHTML = `
    .nowrap {
        white-space: nowrap;
    }
`;
document.head.appendChild(style);

// Group by date and type of request, then display
let currentDate = '';
let currentType = '';
data.forEach(request => {
    const requestDate = new Date(request.DateOfUpdate || request.DateOfRequest).toLocaleDateString();
    if (requestDate !== currentDate) {
        currentDate = requestDate;
        currentType = ''; // Reset current type when date changes
        const dateHeader = document.createElement('tr');
        dateHeader.innerHTML = `<td colspan="3"><b class="date-header">${currentDate}</b></td>`;
        requestsTable.appendChild(dateHeader);
    }
    const capitalizedType = capitalizeWords(request.TypeOfRequest);
    if (capitalizedType !== currentType) {
        currentType = capitalizedType;
    }
    const requestRow = document.createElement('tr');
    requestRow.classList.add('request-row');
    let updateText = '';
    if (request.UpdateToRequest) {
        const updateDate = new Date(request.DateOfUpdate).toLocaleDateString();
        updateText = `<em> Updated:${updateDate} ${request.UpdateToRequest}</em>`;
    }
    requestRow.innerHTML = `
        <td><input type="checkbox" name="updateRequest" value="${request.Id}" class="update-checkbox" aria-label="Select to update request from ${request.FirstName} ${request.LastName}"></td>
        <td class="request-type nowrap">${request.TypeOfRequest} - </td>
        <td class="request-text">
            ${request.FirstName} ${request.LastName}: ${request.InitialRequest}${updateText}
        </td>
    `;
    requestsTable.appendChild(requestRow);

    const updateFormRow = document.createElement('tr');
    updateFormRow.innerHTML = `
        <td colspan="3">
            <form class="update-form" id="updateForm-${request.Id}" aria-label="Update form for request from ${request.FirstName} ${request.LastName}">
                <input type="hidden" name="updateId" value="${request.Id}">
                <textarea name="updateToRequest" placeholder="Update Request" required aria-required="true"></textarea>
                <button type="submit">Update</button>
            </form>
        </td>
    `;
    requestsTable.appendChild(updateFormRow);
});


            // Add event listeners to checkboxes
            document.querySelectorAll('.update-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        document.querySelectorAll('.update-checkbox').forEach(otherCheckbox => {
                            if (otherCheckbox !== event.target) {
                                otherCheckbox.checked = false;
                                const otherForm = document.getElementById(`updateForm-${otherCheckbox.value}`);
                                if (otherForm) {
                                    otherForm.style.display = 'none';
                                }
                            }
                        });
                        const selectedForm = document.getElementById(`updateForm-${event.target.value}`);
                        selectedForm.style.display = 'block';
                    } else {
                        const selectedForm = document.getElementById(`updateForm-${event.target.value}`);
                        selectedForm.style.display = 'none';
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching prayer requests:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });

    // Handle form submission for creating a new request
    const submitButton = document.getElementById('createNewRequest');
    submitButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default form submission

        const form = document.getElementById('newRequestForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/create-prayer-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(newRequest => {
            // Clear the form
            form.reset();
            // Reload the page to display the new record
            location.reload();
        })
        .catch(error => console.error('Error adding new prayer request:', error));
    });

    // Handle form submission for updating a request
    document.addEventListener('submit', (event) => {
        if (event.target.classList.contains('update-form')) {
            event.preventDefault(); // Prevent the default form submission

            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const dateOfUpdate = new Date().toISOString().split('T')[0];

            fetch(`/api/update-prayer-request/${data.updateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Id: data.updateId,
                    UpdateToRequest: data.updateToRequest,
                    DateOfUpdate: dateOfUpdate
                })
            })
            .then(response => response.json())
            .then(updatedRequest => {
                // Clear the form
                form.reset();
                // Reload the page to display the updated record
                location.reload();
            })
            .catch(error => console.error('Error updating prayer request:', error));
        }
    });

    // Print functionality
    function printPrayerRecords() {
        window.print();
    }

    // Add event listener to the print button
    printButton.addEventListener('click', printPrayerRecords);
});
