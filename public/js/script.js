document.addEventListener('DOMContentLoaded', () => {
    fetch('/prayer-requests')
        .then(response => response.json())
        .then(data => {
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
});
