// Chart instance
let expenseChartInstance = null;

// Data for different periods
const periodData = {
    today: {
        label: 'Today',
        totalExpense: '₹2,450.00',
        avgDaily: '₹816.67',
        highestCat: 'Housing',
        budgetStatus: '78%',
        chart: {
            labels: ['Morning', 'Afternoon', 'Evening'],
            datasets: [
                {
                    label: 'Food & Dining',
                    data: [250, 180, 305],
                    backgroundColor: '#10B981'
                },
                {
                    label: 'Transportation',
                    data: [150, 120, 170],
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Entertainment',
                    data: [100, 80, 120],
                    backgroundColor: '#fbbf24'
                },
                {
                    label: 'Utilities',
                    data: [80, 60, 100],
                    backgroundColor: '#a78bfa'
                },
                {
                    label: 'Shopping',
                    data: [120, 100, 130],
                    backgroundColor: '#14b8a6'
                },
                {
                    label: 'Other',
                    data: [90, 75, 95],
                    backgroundColor: '#c084fc'
                }
            ]
        }
    },
    weekly: {
        label: 'Weekly',
        totalExpense: '₹14,850.00',
        avgDaily: '₹2,121.43',
        highestCat: 'Transportation',
        budgetStatus: '65%',
        chart: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [
                {
                    label: 'Food & Dining',
                    data: [450, 380, 520, 410, 480, 350, 300],
                    backgroundColor: '#10B981'
                },
                {
                    label: 'Transportation',
                    data: [300, 280, 420, 350, 500, 200, 180],
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Entertainment',
                    data: [180, 150, 220, 190, 280, 150, 120],
                    backgroundColor: '#fbbf24'
                },
                {
                    label: 'Utilities',
                    data: [150, 140, 180, 160, 200, 100, 90],
                    backgroundColor: '#a78bfa'
                },
                {
                    label: 'Shopping',
                    data: [200, 180, 280, 220, 350, 180, 150],
                    backgroundColor: '#14b8a6'
                },
                {
                    label: 'Other',
                    data: [120, 100, 150, 130, 180, 90, 80],
                    backgroundColor: '#c084fc'
                }
            ]
        }
    },
    monthly: {
        label: 'Monthly',
        totalExpense: '₹58,900.00',
        avgDaily: '₹1,963.33',
        highestCat: 'Housing',
        budgetStatus: '72%',
        chart: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Food & Dining',
                    data: [1800, 1750, 1900, 1650],
                    backgroundColor: '#10B981'
                },
                {
                    label: 'Transportation',
                    data: [1200, 1150, 1300, 1050],
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Entertainment',
                    data: [800, 750, 850, 700],
                    backgroundColor: '#fbbf24'
                },
                {
                    label: 'Utilities',
                    data: [650, 600, 700, 550],
                    backgroundColor: '#a78bfa'
                },
                {
                    label: 'Shopping',
                    data: [1000, 950, 1100, 850],
                    backgroundColor: '#14b8a6'
                },
                {
                    label: 'Other',
                    data: [600, 550, 650, 500],
                    backgroundColor: '#c084fc'
                }
            ]
        }
    },
    yearly: {
        label: 'Yearly',
        totalExpense: '₹706,800.00',
        avgDaily: '₹1,936.99',
        highestCat: 'Housing',
        budgetStatus: '71%',
        chart: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Food & Dining',
                    data: [5400, 5200, 5600, 5300, 5500, 5100, 5700, 5400, 5200, 5600, 5400, 5500],
                    backgroundColor: '#10B981'
                },
                {
                    label: 'Transportation',
                    data: [3600, 3500, 3900, 3700, 3800, 3300, 3900, 3600, 3500, 3900, 3700, 3800],
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Entertainment',
                    data: [2400, 2300, 2600, 2400, 2500, 2200, 2600, 2400, 2300, 2600, 2400, 2500],
                    backgroundColor: '#fbbf24'
                },
                {
                    label: 'Utilities',
                    data: [1950, 1800, 2100, 1900, 2000, 1650, 2100, 1950, 1800, 2100, 1900, 2000],
                    backgroundColor: '#a78bfa'
                },
                {
                    label: 'Shopping',
                    data: [3000, 2900, 3300, 3100, 3200, 2700, 3300, 3000, 2900, 3300, 3100, 3200],
                    backgroundColor: '#14b8a6'
                },
                {
                    label: 'Other',
                    data: [1800, 1600, 1900, 1800, 1900, 1600, 1900, 1800, 1600, 1900, 1800, 1900],
                    backgroundColor: '#c084fc'
                }
            ]
        }
    }
};

// Update UI values
function updateStats(data) {
    document.getElementById('totalExpense').textContent = data.totalExpense;
    document.getElementById('avgDaily').textContent = data.avgDaily;
    document.getElementById('highestCat').textContent = data.highestCat;
    document.getElementById('budgetStatus').textContent = data.budgetStatus;
}

// Initialize chart
function initChart(chartData) {
    const ctx = document.getElementById('expenseChart');
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Destroy existing chart
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    try {
        expenseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            },
                            font: {
                                size: 11
                            },
                            color: '#6b7280'
                        },
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: '#1f2937'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            padding: 15,
                            color: '#1f2937',
                            boxWidth: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + context.parsed.x;
                            }
                        },
                        backgroundColor: '#1f2937',
                        padding: 12,
                        titleFont: {
                            size: 12
                        },
                        bodyFont: {
                            size: 11
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

// Period button handlers
document.addEventListener('DOMContentLoaded', function() {
    const periodBtns = document.querySelectorAll('.period-btn');
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            periodBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get selected period
            const period = this.dataset.period;
            const data = periodData[period];
            
            // Update stats and chart
            updateStats(data);
            initChart(data.chart);
        });
    });
    
    // Initialize with today's data
    const initialData = periodData['today'];
    updateStats(initialData);
    initChart(initialData.chart);
});