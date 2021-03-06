(function(window) {
    'use strict';
    var App = window.App || {};
    var $ = window.jQuery;
    var firebaseHandler = window.firebaseHandler;
    var quizIDInUse;
    var userIDInUse;
    var userTeam;
    var team1Score = 0;
    var team2Score = 0;
    var team3Score = 0;
    var correctAnswers = 0;

    function UIHandler() {

    };

    UIHandler.prototype.login = function(quizIDs, quizNames, userID) {
        userIDInUse = userID;
        $('.intro').hide();
        buildQuizList(quizIDs, quizNames);
    };

    function presentAlertWithMessage(message, parent) {
        var alertHTML = '<div class="alert">' + message + '<div class="save done okay">Okay</div></div>';

        parent.prepend(alertHTML).fadeIn(40);

        $('.okay').on('click touch', function() {
            $('.alert').remove();
        });

    }

    UIHandler.prototype.presentBuzzer = function(quizID, userID) {
        quizIDInUse = quizID;
        userIDInUse = userID;
        $('.intro').hide();
        $('.quiz-list-container').hide();

        var buzzerContainerHTML = '<div class="buzzer-container">' +
            '<div class="buzzer">' +
            '<h1>Push Me!</h1>' +
            '</div>' +
            '<div class="credentials-container">' +
            '<div class="name-change-container">' +
            '<label for="team">Team:' +
            '<input type="number" name="team" min="1" max="3" /><label>' +
            '<label for="name">Name:' +
            '<textarea placeholder="My Name" name="name" class="student-name-textarea"></textarea></label>' +
            '<div class="save done">Done</div>' +
            '</div>' +
            '</div>' +
            '</div>';


        $('.wrapper').append(buzzerContainerHTML);

        $('input[name="team"]').on('keyup', function(e) {
            var charCode = (e.which) ? e.which : e.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57) || $(this).val() > 3 || $(this).val() < 1) {
                $(this).val("");
            }
        });

        $('.done').on('click touch', function(e) {
            var studentName = $('.student-name-textarea').val();
            userTeam = $('input[name="team"]').val();

            if (studentName != "" || userTeam != "") {
                var studentNamePath = "Quizzes/" + quizIDInUse + "/Students/" + userID;
                window.FirebaseHandler.uploadData(studentNamePath, studentName);

                var studentTeamPath = "Quizzes/" + quizIDInUse + "/Teams/Team" + userTeam + "/" + userID;
                window.FirebaseHandler.uploadData(studentTeamPath, studentName);

                $('.credentials-container').hide();

            } else {
                presentAlertWithMessage("Please fill in team and name. Then try again.", $('.name-change-container'));
            }
        });


        $('.buzzer').on('click touch', function(e) {
            var path = "Buzzers/" + quizIDInUse;
            window.FirebaseHandler.uploadData(path, userID);
        });

    }

    UIHandler.prototype.presentBuzzAlert = function(studentName, studentID, questionIndex) {
        var buzzAlertHTML = '<div class="buzz-alert">' +
            '<h1>' + studentName + ' buzzed in!</h1>' +
            '<div class="correct-incorrect-container">' +
            '<div class="save done correct commit-button">Correct!</div>' +
            '<div class="save done incorrect">Incorrect</div>' +
            '</div>' +
            '</div>';
        var questionDisplay = $('.question-display').append(buzzAlertHTML);

        $('.correct').on('click touch', function() {
            correctAnswers++;
            // if correct, increment the student's team score
            // find the team number
            var pointValue;
            if (questionIndex >= 0 && questionIndex <= 5) {
                pointValue = 100;
            } else if (questionIndex >= 6 && questionIndex <= 11) {
                pointValue = 200;
            } else if (questionIndex >= 12 && questionIndex <= 17) {
                pointValue = 300;
            } else if (questionIndex >= 18 && questionIndex <= 23) {
                pointValue = 400;
            } else if (questionIndex >= 24 && questionIndex <= 29) {
                pointValue = 500;
            }
            var team1Path = 'Quizzes/' + quizIDInUse + '/Teams/Team1/' + studentID;
            var team2Path = 'Quizzes/' + quizIDInUse + '/Teams/Team2/' + studentID;
            var team3Path = 'Quizzes/' + quizIDInUse + '/Teams/Team3/' + studentID;
            firebase.database().ref(team1Path).once('value').then(function(snapshot) {
                if (snapshot.val() == studentName) {
                    team1Score += pointValue;
                    updateScores();
                }
            });
            firebase.database().ref(team2Path).once('value').then(function(snapshot) {
                if (snapshot.val() == studentName) {
                    team2Score += pointValue;
                    updateScores();
                }
            });
            firebase.database().ref(team3Path).once('value').then(function(snapshot) {
                if (snapshot.val() == studentName) {
                    team3Score += pointValue;
                    updateScores();
                }
            });

            $('.correct-incorrect-container').remove();
            $('.buzz-alert h1').remove();
            // show correct Answer
            firebase.database().ref('Quizzes/' + quizIDInUse + '/Answers/' + questionIndex).once('value').then(function(snapshot) {
                var answer = snapshot.val();

                var correctAnswerHTML = '<div class="correct-answer">' +
                    '<h1>' + answer + ' </h1>' +
                    '<div class="exit-answer save done commit-button">Done</div>' +
                    '</div>';

                $('.buzz-alert').append(correctAnswerHTML);

                $('.exit-answer').on('click touch', function() {
                    // remove question from list
                    $('div[data-array-index="' + questionIndex + '"]').remove();
                    // exit
                    questionDisplay.remove();
                    if (correctAnswers >= 30) {
                        correctAnswers = 0;
                        displayFinalScores();
                    }

                });
            });
        });

        $('.incorrect').on('click touch', function() {
            // if incorrect, dismiss modal and call listen at buzzer again
            $('.buzz-alert').remove();
            window.FirebaseHandler.listenAtBuzzer(quizIDInUse, questionIndex);
        });
    }

    function displayFinalScores() {
        var winningTeamScore = Math.max(team1Score, team2Score, team3Score);
        var winningTeamName;
        if (winningTeamScore == team1Score) {
            winningTeamName = "Team 1";
        } else if (winningTeamScore == team2Score) {
            winningTeamName = "Team 2";
        } else {
            winningTeamName = "Team 3";
        }

        var winnerDisplay = '<div class="winner-display">' +
            'And the winner is...<br>' +
            '' + winningTeamName + '!<br>' +
            '</div>';

        $('.play-table').remove();
        $('.quiz-container').append(winnerDisplay);


    }

    function updateScores() {
        $('.team-1-score').html('Team 1: ' + team1Score);
        $('.team-2-score').html('Team 2: ' + team2Score);
        $('.team-3-score').html('Team 3: ' + team3Score);
    }

    UIHandler.prototype.fillInPlayQuiz = function(quizData) {
        $('.quiz-container').css('display', 'flex');
        if (!quizData) {
            //TODO: make a message for No quiz exists.
            return;
        }
        var tableHTML = $('<table class="quiz-table play-table"></table>')
        for (var j = 0; j < 6; j++) {
            var tableRowHTML = $('<tr class="quiz-table-row"></tr>')
            for (var k = 0; k < 6; k++) {
                // access quizData at quizData.Whatever[k+((j-1)*6)]
                if (j == 0) {
                    var blurbHTML = '<td><div class="blurb category play">' + quizData.Categories[k] + '</div></td>';
                } else {
                    var blurbHTML = '<td><div data-array-index="' + (k + ((j - 1) * 6)) + '"class="blurb play question">' + (j * 100) + '</div></td>';
                }

                tableRowHTML.append(blurbHTML);
                tableHTML.append(tableRowHTML);
            }
        }
        var quizContainer = $(".quiz-container");
        quizContainer.append(tableHTML);

        $('.question').on('click touch', function(e) {
            var dataIndex = $(e.target).attr("data-array-index");
            // get question data using quizData.Questions[dataIndex]
            var questionDisplayHTML = '<div class="question-display"><input type="image" name="skip" src="images/skip-button.png" class="action-button" /></div>';
            quizContainer.append(questionDisplayHTML);
            $("input[name='skip']").on('click touch', function(e) {
                $('.question-display').remove();
                $('div[data-array-index="' + dataIndex + '"]').remove();
                correctAnswers++;
            });

            window.FirebaseHandler.listenAtBuzzer(quizIDInUse, dataIndex);

            showText(".question-display", quizData.Questions[dataIndex], 0, 150);
        });

        $("input[name='back']").on('click touch', function(e) {
            $('.quiz-container').empty().hide();
            $('.quiz-list-container').show();
        });

        $("input[name='add-student']").on('click touch', function(e) {
            var qrCodeHTML = '<div class="add-student-form">' +
                '<h1>Join Game</h1>' +
                '<h2>Scan this QR Code</h2>' +
                '<div id="qrcode"></div>' +
                '<h2>Or follow this link</h2>' +
                '<textarea readonly>https://gridQuiz.codypotter.com/?id=' + quizIDInUse + '</textarea>' +
                '<div class="save done">Done</div>' +
                '</div>';
            quizContainer.append(qrCodeHTML);
            new QRCode(document.getElementById("qrcode"), ('https://gridQuiz.codypotter.com/?id=' + quizIDInUse));

            $('.done').on('click touch', function() {
                $('.add-student-form').remove();
            });
        });


    }

    UIHandler.prototype.fillInEditQuiz = function(quizData) {
        $('.quiz-container').css('display', 'flex');
        if (!quizData) {
            buildEmptyQuiz();
            return;
        }

        var tableHTML = $('<table class="quiz-table"></table>')
        for (var j = 0; j < 6; j++) {
            var tableRowHTML = $('<tr class="quiz-table-row"></tr>')
            for (var k = 0; k < 6; k++) {
                if (j == 0) {
                    var blurbHTML = '<td><div class="blurb category">' +
                        '<div class="category-textarea-container">' +
                        '<textarea wrap="hard" class="category-textarea" placeholder="Category ` + (k + 1) + `">' + quizData.Categories[k] + '</textarea>' +
                        '</div>' +
                        '</div></td>';
                } else {
                    var blurbHTML = '<td><div class="blurb">' +
                        '<div class="question-textarea-container">' +
                        '<textarea wrap="hard" class="question-textarea" placeholder="Question">' + quizData.Questions[k + ((j - 1) * 6)] + '</textarea>' +
                        '</div>' +
                        '<div class="answer-textarea-container">' +
                        '<textarea wrap="hard" class="answer-textarea" placeholder="Answer">' + quizData.Answers[k + ((j - 1) * 6)] + '</textarea>' +
                        '</div>' +
                        '</div></td>';
                }

                tableRowHTML.append(blurbHTML);
                tableHTML.append(tableRowHTML);
            }
            var quizContainer = $(".quiz-container");
            quizContainer.append(tableHTML);
        }
    };

    function buildQuizList(quizIDs, quizNames) {
        var tbody = $('.quiz-list-table-body');
        for (var i = 0; i < quizIDs.length; i++) {
            var someHTML = '<tr>' +
                '<td>' + quizNames[i] + '</td>' +
                '<td class="action-cell">' +
                '<input type="image" name="play" src="images/play-button.png" class="action-button" />' +
                '<input type="image" name="edit" src="images/edit-button.png" class="action-button" />' +
                '<input type="image" name="delete" src="images/delete-button.png" class="action-button delete-button" />' +
                '</td>' +
                '</tr>';
            tbody.append(someHTML);
        }
        var addQuizHTML = '<tr>' +
            '<td class="new-quiz-cell" colspan="2">' +
            '<input type="image" name="new-quiz" src="images/new-quiz-button.png" class="action-button" />' +
            '</td>' +
            '</tr>';
        tbody.append(addQuizHTML);
        var quizContainer = $(".quiz-container");

        var playButton = $("input[name='play']").on('click touch', function(e) {
            var rowIndex = e.target.parentNode.parentNode.rowIndex - 1;
            quizIDInUse = quizIDs[rowIndex];
            $('.quiz-list-container').hide();
            $('.quiz-container').show();

            window.FirebaseHandler.getQuizData(quizIDInUse, "play");

            var scoreBoardHTML = '<div class="top-bar">' +
                '<input type="image" name="back" src="images/back-button.png" class="action-button" />' +
                '<input type="image" name="add-student" src="images/add-student.png" class="action-button" />' +
                '<table class="scoreboard-table">' +
                '<tr>' +
                '<td class="team-1-score">Team 1: 0</td>' +
                '<td class="team-2-score">Team 2: 0</td>' +
                '<td class="team-3-score">Team 3: 0</td>' +
                '</tr>' +
                '</table>' +
                '</div>';
            quizContainer.append(scoreBoardHTML);
        });

        var editButton = $("input[name='edit']").on('click touch', function(e) {
            var rowIndex = e.target.parentNode.parentNode.rowIndex - 1;
            quizIDInUse = quizIDs[rowIndex];

            $('.quiz-list-container').hide();
            $('.quiz-container').show();

            window.FirebaseHandler.getQuizData(quizIDInUse, "edit");

            var completionBarHTML = '<div class="bottom-bar">' +
                '<textarea wrap="hard" placeholder="Quiz Title" cols="20" rows="1" class="save quiz-name-textarea" required>' + quizNames[rowIndex] + '</textarea>' +
                '<a><div class="save commit-button">Commit Changes</div></a>' +
                '<a><div class="save discard-button">...or discard</div></a>' +
                '</div>';

            quizContainer.append(completionBarHTML);

            $('.commit-button').on('click touch', function(e) {
                var questionAnswerIndex = 0;
                window.FirebaseHandler.uploadData(('Users/' + firebase.auth().currentUser.uid + '/Quizzes/' + quizIDInUse), $('.quiz-name-textarea').val());
                $("tr.quiz-table-row").each(function(rowNumber) {
                    var $this = $(this);
                    for (var colNumber = 0; colNumber < 6; colNumber++) {
                        var blurb = $this.context.cells[colNumber].children[0];
                        if ($(blurb).hasClass('category')) {
                            window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Categories/' + colNumber, $(blurb).find('textarea').val());
                        } else {
                            $(blurb).find('textarea').each(function(index) {
                                if (index == 0) {
                                    window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Questions/' + questionAnswerIndex, $(this).val())
                                } else {
                                    window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Answers/' + questionAnswerIndex, $(this).val())
                                }
                            });
                            questionAnswerIndex++;
                        }
                    }
                });
                quizContainer.empty();
                quizContainer.hide();
                $('.quiz-list-container').show();
            });

            $('.discard-button').on('click touch', function(e) {
                quizContainer.empty();
                quizContainer.hide();
                $('.quiz-list-container').show();
            });
        });

        $("input[name='delete']").on('click touch', function(e) {
            var rowIndex = e.target.parentNode.parentNode.rowIndex - 1;
            var quizIDToDelete = quizIDs[rowIndex];

            window.FirebaseHandler.uploadData(('Quizzes/' + quizIDToDelete), null);
            window.FirebaseHandler.uploadData(('Users/' + userIDInUse + '/Quizzes/' + quizIDToDelete), null);
            tbody.empty();
            quizIDs.splice(rowIndex, 1);
            quizNames.splice(rowIndex, 1);
            buildQuizList(quizIDs, quizNames);

        });

        var newQuizButton = $(".new-quiz-cell").on('click touch', function(e) {
            var rowIndex = e.target.parentNode.parentNode.rowIndex - 1;
            // push a new quiz to firebase at Users/uid/Quizzes
            var key = window.FirebaseHandler.pushData(('Users/' + userIDInUse + '/Quizzes'), 'My New Quiz');
            quizIDs.push(key);
            quizIDInUse = key;

            $('.quiz-list-container').hide();
            $('.quiz-container').show();

            window.FirebaseHandler.getQuizData(quizIDInUse, "edit");
            quizNames.push('My New Quiz');
            var completionBarHTML = '<div class="bottom-bar">' +
                '<textarea wrap="hard" placeholder="Quiz Title" cols="20" rows="1" class="save quiz-name-textarea" required>My New Quiz</textarea>' +
                '<a><div class="save commit-button">Commit Changes</div></a>' +
                '<a><div class="save discard-button">...or discard</div></a>' +
                '</div>';

            quizContainer.append(completionBarHTML);

            $('.commit-button').on('click touch', function(e) {
                var questionAnswerIndex = 0;
                window.FirebaseHandler.uploadData(('Users/' + firebase.auth().currentUser.uid + '/Quizzes/' + quizIDInUse), $('.quiz-name-textarea').val());
                $("tr.quiz-table-row").each(function(rowNumber) {
                    var $this = $(this);
                    for (var colNumber = 0; colNumber < 6; colNumber++) {
                        var blurb = $this.context.cells[colNumber].children[0];
                        if ($(blurb).hasClass('category')) {
                            window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Categories/' + colNumber, $(blurb).find('textarea').val());
                        } else {
                            $(blurb).find('textarea').each(function(index) {
                                if (index == 0) {
                                    window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Questions/' + questionAnswerIndex, $(this).val())
                                } else {
                                    window.FirebaseHandler.uploadData('Quizzes/' + quizIDInUse + '/Answers/' + questionAnswerIndex, $(this).val())
                                }
                            });
                            questionAnswerIndex++;
                        }
                    }
                });
                quizContainer.empty();
                quizContainer.hide();
                tbody.empty();
                buildQuizList(quizIDs, quizNames);
                $('.quiz-list-container').show();
            });

            $('.discard-button').on('click touch', function(e) {
                quizContainer.empty();
                quizContainer.hide();
                tbody.empty();
                buildQuizList(quizIDs, quizNames);
                $('.quiz-list-container').show();
            });
        });
    }

    function buildEmptyQuiz() {

        var tableHTML = $('<table class="quiz-table"></table>')
        for (var j = 0; j < 6; j++) {
            var tableRowHTML = $('<tr class="quiz-table-row"></tr>')
            for (var k = 0; k < 6; k++) {
                if (j == 0) {
                    var blurbHTML = '<td><div class="blurb category">' +
                        '<div class="category-textarea-container">' +
                        '<textarea wrap="hard" class="category-textarea" placeholder="Category ' + (k + 1) + '"></textarea>' +
                        '</div>' +
                        '</div></td>';
                } else {
                    var blurbHTML = '<td><div class="blurb">' +
                        '<div class="question-textarea-container">' +
                        '<textarea wrap="hard" class="question-textarea" placeholder="Question"></textarea>' +
                        '</div>' +
                        '<div class="answer-textarea-container">' +
                        '<textarea wrap="hard" class="answer-textarea" placeholder="Answer"></textarea>' +
                        '</div>' +
                        '</div></td>';
                }

                tableRowHTML.append(blurbHTML);
                tableHTML.append(tableRowHTML);
            }
            var quizContainer = $(".quiz-container");
            quizContainer.append(tableHTML);
        }
    }

    var showText = function(target, message, index, interval) {
        if (index < message.length) {
            $(target).append(message[index++]);
            setTimeout(function() {
                showText(target, message, index, interval);
            }, interval);
        }
    };

    App.UIHandler = UIHandler;
    window.App = App;
})(window);
