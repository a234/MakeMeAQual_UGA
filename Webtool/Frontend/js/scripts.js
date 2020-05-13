$(document).ajaxStart(function() {
    $(document.body).css({'cursor' : 'wait'});
}).ajaxStop(function() {
    $(document.body).css({'cursor' : 'default'});
});
let intersect = (s1, s2) => {
  let s = new Set( [...s1].filter(x => s2.has(x)) );
  return s;
}

let parseQuestions = jsonQuestions => {
  years = Array.from(new Set(jsonQuestions.Problems.map(a => a.year))).sort();
  //years.forEach(j => {
    //$("#selectYears").append($("<option selected></option>").val(j).html(j));
  //});

  let topics = Array.from(new Set([].concat(...jsonQuestions.Problems.map(a => a.tags)))).sort();
  //topics.forEach(j => {
    //$("#selectTopics").append($("<option selected></option>").val(j).html(j));
  //});


  window.selectYears = $('#selectYears').selectize({
    options: years.map(a => ({"text": a, "value": a})),
    items: years,
    onChange: updateSelectedQuestions
  })
  window.selectTopics = $('#selectTopics').selectize({
    options: topics.map(a => ({"text": a, "value": a})),
    items: topics,
    onChange: updateSelectedQuestions
  })
  window.questions = jsonQuestions.Problems;
  updateSelectedQuestions();
}

let updateSelectedQuestions = () => {
  let selectedTopics = new Set( $('#selectTopics').val() );
  let selectedYears = new Set( $('#selectYears').val().map(a => a.toString()) );
  let selectedQuestions = window.questions
    .filter(a => intersect(new Set(a.tags), selectedTopics).size > 0)
    .filter(a => intersect(new Set([a.year.toString()]), selectedYears).size > 0);
  $("#numQuestions").html(selectedQuestions.length);
  window.selectedQuestions = selectedQuestions;
  }

$('#makeQual').on('click', function(event) {
  event.preventDefault();
  updateSelectedQuestions();
  let num_questions= parseInt($('#numberQuestions').val()) || 0;
  let do_pdf = parseInt($("input[name='outputFormat']:checked").val()) == 1 || false;
  $.ajax({
    url: 'https://dzackgarza.com:5000/createqual',
    type: 'post',
    data: JSON.stringify(
      {
        questions: window.selectedQuestions
          .map(a => a.question)
          .map((a) => ({sort: Math.random(), value: a}))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value)
          .slice(0, num_questions),
        do_pdf: do_pdf
      }
    ),
    contentType: "application/json",
    xhr:function(){
      var xhr = new XMLHttpRequest();
      if(do_pdf) {
        xhr.responseType= 'blob'
      }
      return xhr;
    },
    success: function (data) {
      if (do_pdf) {
        let blob = data;
        var link=document.createElement('a');
        link.href=window.URL.createObjectURL(blob);
        link.download="qual.pdf";
        link.click();
      } else{
        var w = window.open('about:blank');
        w.document.open();
        w.document.write(data);
        w.document.close();
      }
    },
    error:   function(jqXHR, textStatus, errorThrown) {
      alert("Error, status = " + textStatus + ", " + "error thrown: " + errorThrown);
    }
  });
});

$('#btnClearAllTopics').on('click', function(event) {
  event.preventDefault();
  window.selectTopics[0].selectize.clear();
});


$('#btnClearAllYears').on('click', function(event) {
  event.preventDefault();
  window.selectYears[0].selectize.clear();
});

fetch("questions.json")
  .then(response => response.json())
  .then(json => parseQuestions(json));
