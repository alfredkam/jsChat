(function (){
    var jsChat = window.jsChat = {
        pollingStopped : false,
        posted : false,
        template : function (messages) {
            var html = "";
            if (messages.length > 0) {
                for (var i in messages) {
                    // html += "<div>"+ messages[i].data.user + "<>" + messages[i].data.msg + "</div>";
                    html += '<div class="_row">\
                    <div class="_name">' + messages[i].user + ':<span class="_timestamp">'+messages[i].timestamp+'</span></div>\
                    <div class="_msg">' + decodeURIComponent(messages[i].msg) + '</div>\
                    </div>';
                }
            }
            return html;
        },
        listener : function (elem, room) {
            var self = this;
            var txt = $(elem).children("._chatWrapper").children('._chatBox');
            var poll = function() {
                // var messages = [];
                $.getJSON('/client/' + room + '/' + self.counter, function(response) {
                 self.counter = response.count;
                 elem.append(self.template(response.messages));
                 if (self.posted) {
                    self.posted = false;
                    elem.scrollTop(elem[0].scrollHeight);
                 }
                 poll();
                }).fail(function (jqxhr, textStatus, error) {
                    console.log("polling stopped");
                    console.log(textStatus + " <> " + error);
                    // self.pollingStopped = true;
                    poll();
                });
            };
            poll();
        },
        post : function (room, msg, elem) {
            if (this.pollingStopped) {
                this.listener(elem, room);
            }
            var name = this.username;
            $.ajax({
                type : 'POST',
                dataType : 'JSON',
                data : {
                    'user' : name
                },
                url : '/msg/' + room + '/' + encodeURIComponent(msg)
            }).fail( function () {
                console.log("client offline?");
            });
            this.posted = true;
        },
        sys : function (elem, room) {
            this.listener(elem.children("._chatWrapper").children("._messageBox"), room);
            var txt = $(elem).children("._chatWrapper").children('._chatBox');
            txt.val("");
            txt.on('keyup', function (e) {
                if (e.keyCode === 13) {
                    if ($.trim(txt.val()) !== "") {
                        self.post(room, txt.val(), elem);
                        txt.val("");
                    }
                }
            });
            var self = this;
            elem.children("._chatWrapper").children("._row").children("a._chatBtn").click(function () {
                if ($.trim(txt.val()) !== elem) {
                    self.post(room, txt.val(), elem);
                    txt.val("");
                }
            });
        },
        init : function (elem, room, username) {
            this.username = username;
            this.counter = 0;
            var self = this;
            $.ajax({
                method : 'GET',
                url : '/clientTemplate',
            }).done(function (res) {
                elem.append(res);
                self.sys(elem, room);
            });
            //calling this to scroll down
            self.posted = true;
        }
    };

})();