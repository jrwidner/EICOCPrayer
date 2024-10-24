document.getElementById('newRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Get form values
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const dateOfRequest = document.getElementById('dateOfRequest').value;
    const typeOfRequest = document.getElementById('typeOfRequest').value;
    const initialRequest = document.getElementById('initialRequest').value;

    // Log the values to ensure they are being captured correctly
    console.log({
        FirstName: firstName,
        LastName: lastName,
        DateOfRequest: dateOfRequest,
        TypeOfRequest: typeOfRequest,
        InitialRequest: initialRequest
    });

    // Send the data to the server
    const response = await fetch('/api/prayer-requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            FirstName: firstName,
            LastName: lastName,
            DateOfRequest: dateOfRequest,
            TypeOfRequest: typeOfRequest,
            InitialRequest: initialRequest
        })
    });

    // Check if the request was successful
    if (response.ok) {
        console.log('Prayer request submitted successfully');
        fetchRequests(); // Refresh the list of prayer requests
    } else {
        console.error('Failed to submit prayer request');
    }
});

// Function to fetch and display prayer requests
async function fetchRequests() {
    const response = await fetch('/api/prayer-requests');
    const requests = await response.json();
    const container = document.getElementById('requests');
    container.innerHTML = '';
    requests.forEach(request => {
        const div = document.createElement('div');
        div.className = 'request';
        div.innerHTML = `
            <p><strong>${request.FirstName} ${request.LastName}</strong></p>
            <p>Type: ${request.TypeOfRequest}</p>
            <p>Request: ${request.InitialRequest}</p>
            ${request.UpdateToRequest ? `<p>Update: ${request.UpdateToRequest}</p>` : ''}
            <p>Date of Request: ${request.DateOfRequest}</p>
            ${request.DateOfUpdate ? `<p>Date of Update: ${request.DateOfUpdate}</p>` : ''}
        `;
        container.appendChild(div);
    });
}

// Fetch requests when the page loads
document.addEventListener('DOMContentLoaded', fetchRequests);
