document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const requestsTable = document.getElementById('requests-table');
    const typeOfRequestSelect = document.getElementById('typeOfRequest');
    const printButton = document.getElementById('printButton');

    if (!spinner || !requestsTable || !typeOfRequestSelect || !printButton) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    let requestsTableBody = requestsTable.querySelector('tbody');
    if (!requestsTableBody) {
        console.warn('The tbody element is missing in the requests table. Creating a new tbody element.');
        requestsTableBody = document.createElement('tbody');
        requestsTable.appendChild(requestsTableBody);
    }

    // Function to capitalize the first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Function to format dates to MM-DD-YYYY
    function formatDateToMMDDYYYY(dateString) {
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${month}-${day}-${year}`;
    }

       // Function to update the prayer types dropdown
    function updatePrayerTypes() {
        const fragment = document.createDocumentFragment();
        const option = document.createElement('option');
        option.value = 'Pantry';
        option.textContent = 'Pantry';
        fragment.appendChild(option);
        typeOfRequestSelect.innerHTML = '';
        typeOfRequestSelect.appendChild(fragment);
    }

    // Show spinner before fetching data
    spinner.style.display = 'block';

        // Fetch and display existing prayer requests
    fetch('/api/prayer-requests')
        .then(response => response.json())
        .then(data => {
            // Filter data to only include requests with a TypeOfRequest of 'pantry'
            data = data.filter(request => request.TypeOfRequest.toLowerCase() === 'pantry');
    
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
    
            let currentDate = '';
            let currentType = '';
            const fragment = document.createDocumentFragment();
            data.forEach(request => {
                const rawDate = request.DateOfUpdate || request.DateOfRequest;
                const requestDate = formatDateToMMDDYYYY(rawDate);
                if (requestDate !== currentDate) {
                    currentDate = requestDate;
                    currentType = ''; // Reset current type when date changes
                    const dateHeader = document.createElement('tr');
                    dateHeader.innerHTML = `<td colspan="3" valign="top"><b class="date-header">${currentDate}</b></td>`;
                    fragment.appendChild(dateHeader);
                }
    
                const capitalizedType = capitalizeWords(request.TypeOfRequest);
                if (capitalizedType !== currentType) {
                    currentType = capitalizedType;
                }
                const requestRow = document.createElement('tr');
                requestRow.classList.add('request-row');
                let updateText = '';
                if (request.UpdateToRequest) {
                    const updateDate = formatDateToMMDDYYYY(request.DateOfUpdate);
                    updateText = `<span class="highlighted-date"> - Updated:${updateDate}</span> ${request.UpdateToRequest}`;
                }
                requestRow.innerHTML = `
                    <td valign="top"><input type="checkbox" name="updateRequest" value="${request.Id}" class="update-checkbox" aria-label="Select to update request from ${request.FirstName} ${request.LastName}"></td>
                    <td class="request-type">${request.TypeOfRequest}: </td>
                    <td class="request-text">
                        ${request.FirstName} ${request.LastName}: ${request.InitialRequest}${updateText}
                    </td>
                `;
                fragment.appendChild(requestRow);
    
                const updateFormRow = document.createElement('tr');
                updateFormRow.innerHTML = `
                    <td colspan="3" valign="top">
                        <form class="update-form" id="updateForm-${request.Id}" aria-label="Update form for request from ${request.FirstName} ${request.LastName}">
                            <input type="hidden" name="updateId" value="${request.Id}">
                            <textarea name="updateToRequest" placeholder="Update Request" required aria-required="true"></textarea>
                            <button type="submit">Update</button>
                        </form>
                    </td>
                `;
                fragment.appendChild(updateFormRow);
            });
            requestsTableBody.innerHTML = '';
            requestsTableBody.appendChild(fragment);
    
            // Add event listeners to checkboxes using event delegation
            requestsTableBody.addEventListener('change', (event) => {
                if (event.target.classList.contains('update-checkbox')) {
                    const selectedForm = document.getElementById(`updateForm-${event.target.value}`);
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
                        selectedForm.style.display = 'block';
                    } else {
                        selectedForm.style.display = 'none';
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching prayer requests:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
    });
