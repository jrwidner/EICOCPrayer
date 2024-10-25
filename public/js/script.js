document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const requestsDiv = document.getElementById('requests');

    // Function to capitalize the first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
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
                requestsDiv.appendChild(requestElement);
            });
        })
        .catch(error => {
            console.error('Error fetching prayer requests:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });

    // Handle form submission
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
});
