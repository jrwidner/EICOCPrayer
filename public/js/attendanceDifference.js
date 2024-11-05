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
            `;
            document.head.appendChild(style);

            let currentDate = '';
            let altBg = true;
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th>Name</th>
                ${data.map(record => {
                    const recordDate = new Date(record.Date).toLocaleDateString();
                    if (recordDate !== currentDate) {
                        currentDate = recordDate;
                        altBg = !altBg;
                        return `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${currentDate}</th>`;
                    }
                    return '';
                }).join('')}
            `;
            attendanceTable.appendChild(headerRow);

            const uniqueNames = [...new Set(data.map(record => `${record.LastName}, ${record.FirstName}`))];
            uniqueNames.forEach(name => {
                const nameRow = document.createElement('tr');
                nameRow.innerHTML = `<td class="nowrap">${name}</td>`;
                data.forEach(record => {
                    if (`${record.LastName}, ${record.FirstName}` === name) {
                        nameRow.innerHTML += `
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                            <td class="nowrap ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
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
