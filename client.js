(function (){
    var jsChat = window.jsChat = {
        //room and dom element
        listener : function (elem, room) {
            var counter = 0;
            var poll = function() {
              $.getJSON('/poll/' + room + '/' + counter, function(response) {
                 counter = response.count;
                 elem.text(elem.text() + response.append);
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