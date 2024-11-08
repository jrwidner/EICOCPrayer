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
        const fragment = document.createDocumentFragment(); // Use DocumentFragment to batch updates
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = capitalizeWords(type);
            option.textContent = capitalizeWords(type);
            fragment.appendChild(option);
        });
        typeOfRequestSelect.innerHTML = ''; // Clear existing options
        typeOfRequestSelect.appendChild(fragment); // Append all options at once
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
                if (dateA > dateB) return -1;
                if (dateA < dateB) return 1;
                return a.TypeOfRequest.localeCompare(b.TypeOfRequest);
            });

            // Create table rows for each request
            const fragment = document.createDocumentFragment(); // Use DocumentFragment to batch updates
            data.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${capitalizeWords(request.TypeOfRequest)}</td>
                    <td>${request.RequesterName}</td>
                    <td>${new Date(request.DateOfRequest).toLocaleDateString()}</td>
                    <td>${new Date(request.DateOfUpdate).toLocaleDateString()}</td>
                    <td>${request.PrayerRequest}</td>
                `;
                fragment.appendChild(row);
            });
            requestsTable.querySelector('tbody').innerHTML = ''; // Clear existing rows
            requestsTable.querySelector('tbody').appendChild(fragment); // Append all rows at once
        })
        .catch(error => {
            console.error('Error fetching prayer requests:', error);
            spinner.style.display = 'none';
        });
});