(function (){
    var jsChat = window.jsChat = {
        //room and dom element
        template : function (messages) {
            console.log(messages);
            var html = "";
            if (messages.length > 0) {
                for (var i in messages) {
                    html += "<div>"+ messages[i].msg + "</div>";
                }
            }

            return html;
        },
        listener : function (elem, room) {
            var counter = 0;
            var self = this;
            var poll = function() {
                // var messages = [];
                $.getJSON('/poll/' + room + '/' + counter, function(response) {
                 counter = response.count;
                 // messages = response.messages;
                 // elem.text(elem.text() + response.append);
                 elem.append(self.template(response.messages));
                 poll();
                });
            };
            poll();
        },
        post : function (room, msg) {
            $.ajax({
                method : 'GET',
                url : '/msg/' + room + '/' + msg
            }).fail( function () {
                console.log("client offline?");
            }); 
        },
        sys : function (elem, room) {
            this.listener(elem.children("._chatWrapper").children("._messageBox"), room);
            var txt = $(elem).children("._chatWrapper").children('._chatBox');
            var self = this;
            elem.children("._chatWrapper").children("._row").children("a._chatBtn").click(function () {
                self.post(room, txt.val());
            });
        },
        init : function (elem, room) {
            var self = this;
            $.ajax({
                method : 'GET',
                url : '/clientTemplate',
            }).done(function (res) {
                elem.append(res);
                self.sys(elem, room);
            });
        }
    };

})();