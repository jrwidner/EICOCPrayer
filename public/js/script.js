document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display existing prayer requests
    fetch('/api/prayer-requests')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Log fetched data
            const requestsDiv = document.getElementById('requests');
            
            // Sort data by DateOfUpdate or DateOfRequest, newest first
            data.sort((a, b) => {
                const dateA = new Date(a.DateOfUpdate || a.DateOfRequest);
                const dateB = new Date(b.DateOfUpdate || b.DateOfRequest);
                return dateB - dateA;
            });

            // Group by date and display
            let currentDate = '';
            data.forEach(request => {
                const requestDate = new Date(request.DateOfUpdate || request.DateOfRequest).toLocaleDateString();
                if (requestDate !== currentDate) {
                    currentDate = requestDate;
                    const dateHeader = document.createElement('h3');
                    dateHeader.textContent = currentDate;
                    requestsDiv.appendChild(dateHeader);
                }
                const requestElement = document.createElement('div');
                requestElement.textContent = `${request.FirstName} ${request.LastName} - ${request.TypeOfRequest}: ${request.InitialRequest}`;
                requestsDiv.appendChild(requestElement);
            });
        })
        .catch(error => console.error('Error fetching prayer requests:', error));

    // Handle form submission
    const form = document.getElementById('newRequestForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the default form submission

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
            console.log('New request added:', newRequest);
            // Optionally, you can update the UI to include the new request
            const requestsDiv = document.getElementById('requests');
            const requestDate = new Date(newRequest.DateOfUpdate || newRequest.DateOfRequest).toLocaleDateString();
            const requestElement = document.createElement('div');
            requestElement.textContent = `${newRequest.FirstName} ${newRequest.LastName} - ${newRequest.TypeOfRequest}: ${newRequest.InitialRequest}`;
            requestsDiv.appendChild(requestElement);
        })
        .catch(error => console.error('Error adding new prayer request:', error));
    });
});
