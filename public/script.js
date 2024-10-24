document.getElementById('prayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/AddOrUpdatePrayerRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    loadRequests();
});

async function loadRequests() {
    const response = await fetch('/api/GetPrayerRequests');
    const requests = await response.json();
    const requestsDiv = document.getElementById('requests');
    requestsDiv.innerHTML = '';

    requests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.innerHTML = `
            <p>Date of Request: ${request.dateOfRequest}</p>
            <p>Name: ${request.name}</p>
            <p>Type of Prayer Request: ${request.type}</p>
            <p>Description: ${request.description}</p>
            <p>Date of Update: ${request.dateOfUpdate}</p>
            <p>Update: ${request.update}</p>
            <button onclick="editRequest('${request.rowKey}')">Edit</button>
            <div id="editForm-${request.rowKey}" class="hidden">
                <form onsubmit="submitEdit(event, '${request.rowKey}')">
                    <label for="update-${request.rowKey}">Update (if any):</label>
                    <textarea id="update-${request.rowKey}" name="update">${request.update}</textarea><br>
                    <button type="submit">Save</button>
                </form>
            </div>
        `;
        requestsDiv.appendChild(requestDiv);
    });
}

function editRequest(id) {
    document.getElementById(`editForm-${id}`).classList.toggle('hidden');
}

async function submitEdit(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    data.id = id;

    await fetch('/api/AddOrUpdatePrayerRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    loadRequests();
}

document.getElementById('exportButton').addEventListener('click', async () => {
    const response = await fetch('/api/ExportPrayerRequests', {
        method: 'POST',
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prayer_requests.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
});

loadRequests();
