    //  fetch('http://localhost:3000/admin/dashboard').then((result)=>console.log(result)).catch((err)=>console.log(err))
     
     const pieChart = document.getElementById('pieChart');
      new Chart(pieChart, {
        type: 'doughnut',
        data: {
        labels: ['A','B','C'],
       datasets: [{
        label: 'Count',
        data: [1,2,3] ,
        backgroundColour : [
            "rgb(52, 152, 219)",
            "rgb(87, 189, 142)",
            "rgb(222, 50, 133)",
            "rgb(236, 97, 35)",
            "rgb(154, 205, 50)",
            "rgb(252, 164, 29)",
            "rgb(59, 113, 199)",
            "rgb(240, 84, 36)"
          ],
        hoverOffset: 4
            }]
      },
      options: {
        responsive : true
      }
    });

    const barGraph = document.getElementById('barGraph');
    new Chart(barGraph, {
      type: 'bar',
      data: {
      labels: ['A','B','C'],
     datasets: [{
      label: 'Count',
      data: [1,2,3] ,
      backgroundColour : [
          "rgb(52, 152, 219)",
          "rgb(87, 189, 142)",
          "rgb(222, 50, 133)",
          "rgb(236, 97, 35)",
          "rgb(154, 205, 50)",
          "rgb(252, 164, 29)",
          "rgb(59, 113, 199)",
          "rgb(240, 84, 36)"
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ],
        borderWidth: 1,
        hoverOffset: 4
    }]
},
    options: {
      responsive : true
    }
  });
