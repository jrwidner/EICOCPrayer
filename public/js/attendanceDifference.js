document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');
    const clearSelectionButton = document.getElementById('clear-selection');
    const attendanceFilter = document.getElementById('attendance-filter');
    const infoBlock = document.getElementById('info-block');
    const ctx = document.getElementById('attendanceChart').getContext('2d');

    if (!spinner || !attendanceTable || !memberSelect || !clearSelectionButton || !infoBlock || !ctx) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    spinner.style.display = 'block';

    fetch('/api/attendance-difference')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            spinner.style.display = 'none';
            console.log('Data received from API:', data); // Debug logging

            // Check if data is an array
            if (!Array.isArray(data)) {
                throw new TypeError('Expected data to be an array');
            }

            const attendanceData = data;
            attendanceData.sort((a, b) => a.LastName.localeCompare(b.LastName));
            const uniqueNames = [...new Set(attendanceData.map(record => `${record.LastName}, ${record.FirstName}`))];
            const fragment = document.createDocumentFragment();
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                fragment.appendChild(option);
            });
            memberSelect.appendChild(fragment);
            const uniqueDates = [...new Set(attendanceData.map(record => new Date(record.Date).toLocaleDateString()))];
            const totalWeeks = uniqueDates.length;
            const filterDataByAttendance = (data, criteria) => {
                return data.filter(record => {
                    if (criteria === 'high') return record.WorshipAttendancePercentage >= 75;
                    if (criteria === 'medium') return record.WorshipAttendancePercentage >= 50 && record.WorshipAttendancePercentage < 75;
                    if (criteria === 'low') return record.WorshipAttendancePercentage < 50;
                    return true; // 'all' criteria
                });
            };
            const renderTable = (selectedMembers, worshipFilterCriteria = 'all') => {
                attendanceTable.innerHTML = '';
                let filteredData = filterDataByAttendance(attendanceData, worshipFilterCriteria);
                const filteredNames = [...new Set(filteredData.map(record => `${record.LastName}, ${record.FirstName}`))];
                const fragment = document.createDocumentFragment();
                let altBg = true;
                const dateHeaderRow = document.createElement('tr');
                const serviceHeaderRow = document.createElement('tr');
                dateHeaderRow.innerHTML = `<th>Name</th>`;
                serviceHeaderRow.innerHTML = `<th></th>`;
                uniqueDates.sort((a, b) => new Date(b) - new Date(a));
                uniqueDates.forEach(date => {
                    altBg = !altBg;
                    dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                    serviceHeaderRow.innerHTML += `<th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th><th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Class</th>`;
                });
                fragment.appendChild(dateHeaderRow);
                fragment.appendChild(serviceHeaderRow);
                const totalAttendanceRow = document.createElement('tr');
                totalAttendanceRow.innerHTML = `<td></td>`;
                uniqueDates.forEach(date => {
                    const totalWorshipAttendees = filteredData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length;
                    const totalBibleClassAttendees = filteredData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length;
                    totalAttendanceRow.innerHTML += `<td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalWorshipAttendees}</td><td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalBibleClassAttendees}</td>`;
                });
                fragment.appendChild(totalAttendanceRow);
                filteredNames.forEach((name, index) => {
                    const memberRecord = filteredData.find(record => `${record.LastName}, ${record.FirstName}` === name);
                    if (memberRecord) {
                        let worshipColor = 'red';
                        if (memberRecord.WorshipAttendancePercentage >= 75) worshipColor = 'green';
                        else if (memberRecord.WorshipAttendancePercentage >= 50) worshipColor = 'rgb(185, 92, 6)';
                        let bibleClassColor = 'red';
                        if (memberRecord.BibleClassAttendancePercentage >= 75) bibleClassColor = 'green';
                        else if (memberRecord.BibleClassAttendancePercentage >= 50) bibleClassColor = 'rgb(185, 92, 6)';
                        if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                            const nameRow = document.createElement('tr');
                            nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                            nameRow.innerHTML = `<td class="nowrap"><span class="name">${name}</span><br>${memberRecord.TotalWorships} Worships <span style="color:${worshipColor}">${memberRecord.WorshipAttendancePercentage}%</span> - ${memberRecord.TotalBibleClasses} Bible Classes <span style="color:${bibleClassColor}">${memberRecord.BibleClassAttendancePercentage}%</span></td>`;
                            uniqueDates.forEach(date => {
                                const record = filteredData.find(record => `${record.LastName}, ${record.FirstName}` === name && new Date(record.Date).toLocaleDateString() === date);
                                if (record) {
                                    nameRow.innerHTML += `<td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td><td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>`;
                                } else {
                                    nameRow.innerHTML += `<td class="nowrap"><span class="no-data">∅</span></td><td class="nowrap"><span class="no-data">∅</span></td>`;
                                }
                            });
                            fragment.appendChild(nameRow);
                        }
                    }
                });
                attendanceTable.appendChild(fragment);
            };
            renderTable([], 'all');
            attendanceFilter.addEventListener('change', () => {
                const worshipCriteria = attendanceFilter.value;
                renderTable(Array.from(memberSelect.selectedOptions).map(option => option.value), worshipCriteria);
            });
            memberSelect.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions, attendanceFilter.value);
            });
            clearSelectionButton.addEventListener('click', () => {
                memberSelect.selectedIndex = -1;
                renderTable([], attendanceFilter.value);
            });
            infoBlock.innerHTML = `<p><strong>Legend:</strong></p><p><span class="checkmark">✓</span> Attended <span class="cross">✗</span> Not Attended <span class="no-data">∅</span> Attendance not recorded</p>`;
            const attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: uniqueDates.reverse(),
                    datasets: [
                        {
                            label: 'Worship Attendance',
                            data: uniqueDates.map(date => attendanceData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Bible Class Attendance',
                            data: uniqueDates.map(date => attendanceData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Weeks'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Attendance'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            spinner.style.display = 'none';
        });
});
