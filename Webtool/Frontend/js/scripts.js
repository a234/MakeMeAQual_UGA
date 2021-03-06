const devmode = false;

$(document).ajaxStart(function() {
    $(document.body).css({'cursor' : 'wait'});
}).ajaxStop(function() {
    $(document.body).css({'cursor' : 'default'});
});

Selectize.prototype.selectall = function(){
    var self = this;
    self.setValue(Object.keys(self.options));
    self.focus();
};

let intersect = (s1, s2) => {
  let s = new Set( [...s1].filter(x => s2.has(x)) );
  return s;
}

let updateSelectOptions = exam_name => {
  
  let jsonQuestions = window.questions;

  let years = Array.from( new Set(
    jsonQuestions
    .filter(a => a.exam == exam_name)
    .map(a => a.year)
  )).sort();
  
  let topics = Array.from(new Set(
    [].concat(
      ...jsonQuestions
      .filter(a => a.exam == exam_name)
      .map(a => a.tags)
    )
  )).sort();
  
  let universities = Array.from( new Set(
    [].concat(
      ...jsonQuestions
      .filter(a => a.exam == exam_name)
      .map(a => a.university)
    )
  )).sort();
 
  if (window.selectYears[0]) window.selectYears[0].selectize.destroy();
  window.selectYears = $('#selectYears').selectize({
    options: years.map(a => ({"text": a, "value": a})),
    items: years,
    onChange: updateSelectedQuestions,
    selectOnTab: true
  })
  if (window.selectTopics[0]) window.selectTopics[0].selectize.destroy();
  window.selectTopics = $('#selectTopics').selectize({
    options: topics.map(a => ({"text": a, "value": a})),
    items: topics,
    onChange: updateSelectedQuestions,
    selectOnTab: true
  })
  if (window.selectUniversities[0]) window.selectUniversities[0].selectize.destroy();
  window.selectUniversities = $('#selectUniversities').selectize({
    options: universities.map(a => ({"text": a, "value": a})),
    items: universities,
    onChange: updateSelectedQuestions,
    selectOnTab: true
  })
}

let parseQuestions = jsonQuestions => {
  window.questions = jsonQuestions;

  updateSelectOptions("Algebra");
 
  // Labels with numbers of questions
  $('label[for=AlgebraRadio]').html(
    `Algebra <small class=text-muted>(${jsonQuestions.map(a => a.exam).filter(a => a == "Algebra").length})</small>`
  )
  $('label[for=RealAnalysisRadio]').html(
    `Real Analysis <small class=text-muted>(${jsonQuestions.map(a => a.exam).filter(a => a == "Real_Analysis").length})</small>`
  )
  $('label[for=TopologyRadio]').html(
    `Topology <small class=text-muted>(${jsonQuestions.map(a => a.exam).filter(a => a == "Topology").length})</small>`
  )
  $('label[for=ComplexAnalysisRadio]').html(
    `Complex Analysis <small class=text-muted>(${jsonQuestions.map(a => a.exam).filter(a => a == "Complex_Analysis").length})</small>`
  )
  updateSelectedQuestions();
}

let updateSelectedQuestions = () => {
  let selectedTopics = new Set( $('#selectTopics').val() );
  let selectedYears = new Set( $('#selectYears').val().map(a => a.toString()) );
  let selectedUniversities = [...new Set( $('#selectUniversities').val().map(a => a.toString()) )];
  let examType = $("input[name='examType']:checked").val()
  let selectedQuestions = window.questions
    .filter(a => a.exam == examType)
    .filter(a => intersect(new Set(a.tags), selectedTopics).size > 0)
    .filter(a => selectedUniversities.indexOf(a.university) >= 0)
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
    url: devmode ? 'http://127.0.0.1:5000/createqual' : 'https://dzackgarza.com:5000/createqual',
    type: 'post',
    data: JSON.stringify({
      questions: window.selectedQuestions,
      do_pdf: do_pdf,
      num_questions: num_questions
    }),
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

// Clear/Select All Topics
$('#btnClearAllTopics').on('click', function(event) {
  event.preventDefault();
  window.selectTopics[0].selectize.clear();
});
$('#btnSelectAllTopics').on('click', function(event) {
  event.preventDefault();
  window.selectTopics[0].selectize.selectall();
});

// Clear/Select All Years
$('#btnClearAllYears').on('click', function(event) {
  event.preventDefault();
  window.selectYears[0].selectize.clear();
});
$('#btnSelectAllYears').on('click', function(event) {
  event.preventDefault();
  window.selectYears[0].selectize.selectall();
});

// Update options on exam type change
$('input[type=radio][name=examType]').change(function () {
  updateSelectOptions( $(this).val() );
  updateSelectedQuestions();
})

// Start setting up form.
fetch("AllQuestions.json")
  .then(response => response.json())
  .then(json => parseQuestions(json));

