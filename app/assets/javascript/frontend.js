var webclientUI = {
    players: new PlayerList(),
    channels: new ChannelList(),
    pms: new PMList(),
    battles: new BattleList(),
    tabs: [],

    printDisconnectionMessage : function(html) {
        webclientUI.printHtml("<b>Disconnected from Server! If the disconnect is due to an internet problem, try to <a href='po:reconnect/'>reconnect</a> once the issue is solved. You can also go back to the <a href='" + config.registry + "'>server list</a>.</b>");
    },

    printHtml : function(html) {
        for (id in webclientUI.channels.channels()) {
            webclientUI.channels.channel(id).printHtml(html);
        }
    },

    printMessage : function(msg, html) {
        for (id in webclientUI.channels.channels()) {
            webclientUI.channels.channel(id).printMessage(msg, html);
        }
    },

    switchToTab : function(wid) {
        console.log("Switch to tab: " + wid);
        var id = wid.substr(wid.lastIndexOf("-") + 1)
        var obj;
        if (/^channel-/.test(wid)) {
            obj = webclientUI.channels.channel(id);
        } else if (/^pm-/.test(wid)) {
            obj = webclient.pms.pm(id);
        } else if (/^battle-/.test(wid)) {
            obj = webclientUI.battles.battle(id);
        }

        obj.setCurrentTab();
    }
};

vex.defaultOptions.className = 'vex-theme-os';

$(function() {
    webclientUI.linkClickHandler = function (event) {
        var href = this.href,
            sep, cmd, payload, pid;

        if (/^po:/.test(href)) {
            event.preventDefault();

            console.log("trigger " + href);

            sep = href.indexOf("/");
            cmd = href.slice(3, sep);

            payload = decodeURIComponent(href.slice(sep + 1));

            // Add other commands here..
            pid = webclient.players.id(payload);
            if (pid === -1) {
                pid = parseInt(payload, 10);
            }

            if (cmd === "join") {
                webclient.joinChannel(payload);
            } else if (cmd === "pm") { // Create pm window
                if (!isNaN(pid)) {
                    webclient.pms.pm(pid).activateTab();
                }
            } else if (cmd === "ignore") {
                // Ignore the user
                if (!isNaN(pid)) {
                    if (!webclient.players.isIgnored(pid)) {
                        webclient.players.addIgnore(pid);
                    } else {
                        webclient.players.removeIgnore(pid);
                    }
                }
            } else if (cmd === "watch") {
                network.command('watch', {battle: +payload});
            } else if (cmd === "send") {
                webclient.channel.sendMessage(payload);
            } else if (cmd === "setmsg") {
                webclient.channel.chat.input.val(payload);
            } else if (cmd === "appendmsg") {
                webclient.channel.chat.input.val(webclient.channel.chat.input.val() + payload);
            } else if (cmd === "reconnect") {
                //window.location.href= window.location.pathname;
                window.location.reload();
            } else if (cmd === "watch-player") {
                if (webclient.battles.isBattling(+payload)) {
                    network.command('watch', {battle: webclient.battles.battleOfPlayer(+payload)});
                }
            } else if (cmd === "kick") {
                network.command('kick', {id: +payload});
            } else if (cmd === "ban") {
                network.command('ban', {id: +payload});
            }
        } else {
            if (webclient.connectedToServer && !$(this).attr("target")) {
                /* Make sure link opens in a new window */
                this.target = "_blank";
            }
        }
    };
    /* handle clicks on links, especially with po: urls */
    $(document).on("click", "a", webclientUI.linkClickHandler);

    webclient.players.on("ignoreadd", function(id) {
        webclientUI.printHtml("<em>You ignored " + utils.escapeHtml(webclient.players.name(id)) + ".</em>");
    }).on("ignoreremove", function(id) {
        webclientUI.printHtml("<em>You stopped ignoring " + utils.escapeHtml(webclient.players.name(id)) + ".</em>");
    });
});

window.onbeforeunload = function(e) {
    if (webclient.connectedToServer) {
        return 'Are you sure you want to disconnect from the server?';
    }
};
