document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const requestsDiv = document.getElementById('requests');
    const typeOfRequestSelect = document.getElementById('typeOfRequest');
    const selectRequest = document.getElementById('selectRequest');
    const updateRequestForm = document.getElementById('updateRequestForm');

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

    // Function to update the select request dropdown
    function updateSelectRequest(requests) {
        selectRequest.innerHTML = ''; // Clear existing options
        requests.forEach(request => {
            const option = document.createElement('option');
            option.value = request.Id; // Assuming each request has a unique Id
            option.textContent = `${request.FirstName} ${request.LastName} - ${request.TypeOfRequest}`;
            selectRequest.appendChild(option);
        });
    }

    // Show spinner before fetching data
    spinner.style.display = 'block';

    // Fetch and display existing prayer requests
    fetch('/api/prayer-requests')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Log fetched data

            // Hide spinner after data is fetched
            spinner.style.display = 'none';

            // Extract unique prayer types
            const prayerTypes = [...new Set(data.map(request => request.TypeOfRequest.toLowerCase()))];
            updatePrayerTypes(prayerTypes);

            // Update select request dropdown
            updateSelectRequest(data);

            // Sort data by DateOfUpdate or DateOfRequest, newest first, then by TypeOfRequest
            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                if (dateB - dateA !== 0) {
                    return dateB - dateA;
                }
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });

            // Group by date and type of request, then display
            let currentDate = '';
            let currentType = '';
            data.forEach(request => {
                const requestDate = new Date(request.DateOfUpdate || request.DateOfRequest).toLocaleDateString();
                if (requestDate !== currentDate) {
                    currentDate = requestDate;
                    currentType = ''; // Reset current type when date changes
                    const dateHeader = document.createElement('h3');
                    dateHeader.textContent = currentDate;
                    dateHeader.classList.add('date-header');
                    requestsDiv.appendChild(dateHeader);
                }
                const capitalizedType = capitalizeWords(request.TypeOfRequest);
                if (capitalizedType !== currentType) {
                    currentType = capitalizedType;
                    const typeHeader = document.createElement('h4');
                    typeHeader.textContent = currentType;
                    requestsDiv.appendChild(typeHeader);
                }
                const requestElement = document.createElement('div');
                requestElement.textContent = `${request.FirstName} ${request.LastName}: ${request.InitialRequest}`;
                requestElement.classList.add('request');
                requestsDiv.appendChild(requestElement);
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

        // Log the form data to check its contents
        console.log('Form data:', data);

        fetch('/api/create-prayer-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                dateOfRequest: data.dateOfRequest,
                typeOfRequest: data.typeOfRequest,
                initialRequest: data.initialRequest
            })
        })
        .then(response => response.json())
        .then(newRequest => {
            console.log('New request added:', newRequest);
            // Clear the form
            form.reset();
            // Reload the page to display the new record
            location.reload();
        })
        .catch(error => console.error('Error adding new prayer request:', error));
    });

    // Handle selection of a request to update
    selectRequest.addEventListener('change', (event) => {
        const selectedId = event.target.value;
        fetch(`/api/prayer-requests/${selectedId}`)
            .then(response => response.json())
            .then(request => {
                document.getElementById('updateId').value = request.Id;
                document.getElementById('updateFirstName').value = request.FirstName;
                document.getElementById('updateLastName').value = request.LastName;
                document.getElementById('updateDateOfRequest').value = new Date(request.DateOfRequest).toISOString().split('T')[0];
                document.getElementById('updateTypeOfRequest').value = request.TypeOfRequest;
                document.getElementById('updateInitialRequest').value = request.InitialRequest;
            })
            .catch(error => console.error('Error fetching prayer request:', error));
    });

    // Handle form submission for updating a request
    const updateButton = document.getElementById('updateRequest');
    updateButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default form submission

        const selectedId = document.getElementById('updateId').value;
        const updateToRequest = document.getElementById('updateToRequest').value;
        const dateOfUpdate = new Date().toISOString().split('T')[0];

        fetch(`/api/update-prayer-request/${selectedId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                updateToRequest: updateToRequest,
                dateOfUpdate: dateOfUpdate
            })
        })
        .then(response => response.json())
        .then(updatedRequest => {
            console.log('Request updated:', updatedRequest);
            // Clear the form
            updateRequestForm.reset();
            // Reload the page to display the updated record
            location.reload();
        })
        .catch(error => console.error('Error updating prayer request:', error));
    });
});
