document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');
    const clearSelectionButton = document.getElementById('clear-selection');
    const infoBlock = document.getElementById('info-block');
    spinner.style.display = 'block';
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            spinner.style.display = 'none';
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));
            const filteredData = data.filter(record => {
                const memberRecords = data.filter(r => `${r.LastName}, ${r.FirstName}` === `${record.LastName}, ${record.FirstName}`);
                const worshipCount = memberRecords.filter(r => r.WorshipService).length;
                const recentRecords = memberRecords.slice(-4);
                const recentWorshipCount = recentRecords.filter(r => r.WorshipService).length;
                return !(worshipCount >= 0 && worshipCount <= 4 && recentWorshipCount < 3);
            });
            const uniqueNames = [...new Set(filteredData.map(record => `${record.LastName}, ${record.FirstName}`))];
            const fragment = document.createDocumentFragment();
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                fragment.appendChild(option);
            });
            memberSelect.appendChild(fragment);
            const uniqueDates = [...new Set(filteredData.map(record => new Date(record.Date).toLocaleDateString()))];
            const totalWeeks = uniqueDates.length;
            const calculateAttendance = (records, name) => {
                const memberRecords = records.filter(record => `${record.LastName}, ${record.FirstName}` === name);
                const worshipCount = memberRecords.filter(record => record.WorshipService).length;
                const bibleClassCount = memberRecords.filter(record => record.BibleClass).length;
                const worshipPercentage = totalWeeks ? (worshipCount / totalWeeks * 100).toFixed(2) : 0;
                const bibleClassPercentage = worshipCount ? (bibleClassCount / worshipCount * 100).toFixed(2) : 0;
                return { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords: memberRecords.length };
            };
            const renderTable = (selectedMembers) => {
                attendanceTable.innerHTML = '';
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
                uniqueNames.forEach((name, index) => {
                    const { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount } = calculateAttendance(filteredData, name);
                    let worshipColor = 'red';
                    if (worshipPercentage >= 75) worshipColor = 'green';
                    else if (worshipPercentage >= 50) worshipColor = 'rgb(185, 92, 6)';
                    let bibleClassColor = 'red';
                    if (bibleClassPercentage >= 75) bibleClassColor = 'green';
                    else if (bibleClassPercentage >= 50) bibleClassColor = 'rgb(185, 92, 6)';
                    if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                        const nameRow = document.createElement('tr');
                        nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                        nameRow.innerHTML = `<td class="nowrap"><span class="name">${name}</span><br>${worshipCount} Worships <span style="color:${worshipColor}">${worshipPercentage}%</span> - ${bibleClassCount} Bible Classes <span style="color:${bibleClassColor}">${bibleClassPercentage}%</span></td>`;
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
                });
                attendanceTable.appendChild(fragment);
            };
            renderTable([]);
            memberSelect.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions);
            });
            clearSelectionButton.addEventListener('click', () => {
                memberSelect.selectedIndex = -1;
                renderTable([]);
            });
            infoBlock.innerHTML = `<p>Total Number of Possible Worship Services: ${totalWeeks}</p><p><strong>Legend:</strong></p><p><span class="checkmark">✓</span> Attended <span class="cross">✗</span> Not Attended <span class="no-data">∅</span> Attendance not recorded</p>`;
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            const attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: uniqueDates.reverse(),
                    datasets: [
                        {
                            label: 'Worship Attendance',
                            data: uniqueDates.map(date => filteredData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Bible Class Attendance',
                            data: uniqueDates.map(date => filteredData.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length),
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
