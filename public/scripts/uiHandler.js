/* ----------------------------------------------------------------------------
	uiHandler.js will alter index.html if the user signs in. It will remove
the log in box, push the background to the left (making a side bar), and
reveals a lighter background where the current selected option will reside.
-----------------------------------------------------------------------------*/

// TODO: put current selected option into not sidebar part of wrapper

(function(window) {
  'use strict';
  var App = window.App || {};
  var $ = window.jQuery;
  var FirebaseHandler = App.FirebaseHandler;
  var firebaseHandler = new FirebaseHandler();

  function UIHandler() {

  };

  UIHandler.prototype.login = function(quizIDs, quizNames){
    var loginContainer = $('.login-container');
    loginContainer.remove();

    hideIntro();
    buildQuizList(quizIDs, quizNames);
  };

  UIHandler.prototype.fillInEditQuiz = function(questions) {
      console.log(questions);
      var tableHTML = $('<table class="edit-quiz-table"></table>')
      for (var j = 0; j < 6; j++) {
          var tableRowHTML = $('<tr class="quiz-table-row"></tr>')
          for (var k = 0; k < 6; k++) {
              if (j == 0) {
                  var blurbHTML = `
                  <td><div class="blurb category">
                    <div class="category-textarea-container">
                        <textarea rows="2" cols="10" placeholder="Category ` + (k+1) + `"></textarea>
                    </div>
                  </div></td>
                  `;
              } else {
                  var blurbHTML = `
                  <td><div class="blurb">
                      <div class="question-textarea-container">
                          <textarea rows="2" cols="10" placeholder="Question"></textarea>
                      </div>
                      <div class="answer-textarea-container">
                          <textarea rows="2" cols="10" placeholder="Answer"></textarea>
                      </div>
                  </div></td>
                  `;
              }

              tableRowHTML.append(blurbHTML);
              tableHTML.append(tableRowHTML);
          }
          var quizContainer = $(".quiz-container");
          quizContainer.append(tableHTML);
      }
  };

  function hideIntro() {
    $('.intro').width('0');
  }

  function buildQuizList(quizIDs, quizNames) {
    var tbody = $('.quiz-list-table-body');
    for (var i = 0; i < quizIDs.length; i++) {
      var someHTML = `
        <tr>
          <td>${quizNames[i]}</td>
          <td class="status-cell">&#9679; Ready</td>
          <td class="action-cell">
            <input type="image" name="play" src="images/play-button.png" class="action-button">
            <input type="image" name="edit" src="images/edit-button.png" class="action-button">
          </td>
        </tr>
      `;
      tbody.append(someHTML);
    }
    var quizContainer = $(".quiz-container");

    var playButton = $("input[name='play']").click(function(e) {
      console.log(e);
      e.target.style.backgroundColor = "#375f77";
      var quizListContainer = $('.quiz-list-container').empty();
      quizListContainer.width('0');
    });

    var editButton = $("input[name='edit']").click(function(e) {
      var rowIndex = e.target.parentNode.parentNode.rowIndex - 1;
      e.target.style.backgroundColor = "#375f77";
      var qlc = $('.quiz-list-container').empty();
      qlc.hide();

      firebaseHandler.getQuestions(quizIDs[rowIndex]);
      var completionBarHTML = `
        <div class="bottom-bar">
            <a><div class="save commit-button">Commit Changes</div><a>
            <a><div class="save discard-button">...or discard</div><a>
        </div>
      `;
      quizContainer.append(completionBarHTML);
      $('.commit-button').click(function(e) {
          $("tr.quiz-table-row").each(function(rowNumber) {
              console.log("Row Number:" + rowNumber);
              var $this = $(this);
              for(i = 0; i < 6; i++) {
                  var $blurb = $this.context.cells[i].children[0];
                  if ($($blurb).hasClass('category')){
                      console.log("It's a category blurb");
                      console.log($($blurb).find('textarea').val());
                  } else {
                      $($blurb).find('textarea').each(function(index){
                          console.log(index + ": " + $(this).val());
                      });
                  }
              }
          });
      });
    });
  }

  App.UIHandler = UIHandler;
  window.App = App;
})(window);
