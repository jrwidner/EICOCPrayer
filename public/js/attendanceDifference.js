document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table');

    // Show spinner before fetching data
    spinner.style.display = 'block';

    // Fetch and display attendance data
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            // Hide spinner after data is fetched
            spinner.style.display = 'none';

            // Sort data by date, newest first
            data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

            // Sort data by last name in descending order
            data.sort((a, b) => b.LastName.localeCompare(a.LastName));

            // Add this CSS to your stylesheet or within a <style> tag
            const style = document.createElement('style');
            style.innerHTML = `
                .nowrap {
                    white-space: nowrap;
                }
                .checkmark {
                    color: green;
                }
                .cross {
                    color: red;
                }
                .no-data {
                    color: blue;
                }
                .date-header {
                    font-weight: bold;
                    text-align: center;
                }
                .alt-bg-1 {
                    background-color: #f0f0f0;
                }
                .alt-bg-2 {
                    background-color: #e0e0e0;
                }
                table {
                    border-collapse: collapse;
                    margin: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                }
            `;
            document.head.appendChild(style);

            let currentDate = '';
            let altBg = true;

            // Create the header rows
            const dateHeaderRow = document.createElement('tr');
            const serviceHeaderRow = document.createElement('tr');
            dateHeaderRow.innerHTML = `<th>Name</th>`;
            serviceHeaderRow.innerHTML = `<th></th>`;

            const uniqueDates = [...new Set(data.map(record => new Date(record.Date).toLocaleDateString()))];
            uniqueDates.forEach(date => {
                altBg = !altBg;
                dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                serviceHeaderRow.innerHTML += `
                    <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th>
                    <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Bible Class</th>
                `;
            });

            attendanceTable.appendChild(dateHeaderRow);
            attendanceTable.appendChild(serviceHeaderRow);

            const uniqueNames = [...new Set(data.map(record => `${record.LastName}, ${record.FirstName}`))];
            uniqueNames.forEach(name => {
                const nameRow = document.createElement('tr');
                nameRow.innerHTML = `<td class="nowrap">${name}</td>`;
                uniqueDates.forEach(date => {
                    const record = data.find(record => 
                        `${record.LastName}, ${record.FirstName}` === name && 
                        new Date(record.Date).toLocaleDateString() === date
                    );
                    if (record) {
                        nameRow.innerHTML += `
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                        `;
                    } else {
                        nameRow.innerHTML += `
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}"><span class="no-data">⦸</span></td>
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}"><span class="no-data">⦸</span></td>
                        `;
                    }
                });
                attendanceTable.appendChild(nameRow);
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
});
