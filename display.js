var banCheckerButton = document.createElement('a');
banCheckerButton.setAttribute('href', "//steamcommunity.com/my/friends/banchecker");
banCheckerButton.classList.add('sectionTab');
banCheckerButton.innerHTML = "<span>Ban Checker</span>";
document.querySelector('.responsive_tab_select').innerHTML += '<option value="//steamcommunity.com/my/friends/banchecker">Ban Checker</option>';

if (window.location.pathname.split("/").pop() == 'banchecker'){
  document.querySelector('.sectionTabs a:first-child').classList.remove('active');
  banCheckerButton.classList.add('active');
  renderBanCheker();
}
document.querySelector('.sectionTabs').appendChild(banCheckerButton);

function createPlayerElement(player){
  var playerBody = document.createElement('div');
  playerBody.classList.add('friendBlock', 'persona');
  if (player.bannedAfterRecording) playerBody.classList.add('banned');
  playerBody.setAttribute('data-miniprofile', player.miniprofile);
  playerBody.setAttribute('href', "//steamcommunity.com/profiles/" + player.steamid);
  playerBody.innerHTML = '<a class="friendBlockLinkOverlay" href="//steamcommunity.com/profiles/' + player.steamid + '"></a>';
  var avatar = document.createElement('div');
  avatar.classList.add('playerAvatar');
  // We'll load avatars like this so we don't waste steam api calls
  fetch('http://steamcommunity.com/profiles/' + player.steamid + '?xml=1')
  .then(response => response.text())
  .then(function(xml){
    var regex = /http:\/\/(.+)_medium.jpg/;
    var avatarURLs = xml.match(regex);
    if (avatarURLs != null) {
      var avatarURL = avatarURLs[0];
      avatar.innerHTML = '<img src=' + avatarURL + '>';
    }
    //console.log(avatar);
    var thisPlayer = document.querySelectorAll('.friendBlock[data-miniprofile="' + player.miniprofile + '"]');
    thisPlayer.forEach(function(thisOne){
      if (thisOne.querySelector('.playerAvatar') == null) {
        thisOne.insertAdjacentElement('afterbegin', avatar);
      };
    });
    //console.log(player.miniprofile);
  });
  var name = document.createElement('div');
  name.innerHTML = player.name;
  playerBody.appendChild(name);
  if (player.bannedAfterRecording) playerBody.style.backgroundColor = "rgba(230,0,0,0.3)";
  return playerBody;
}

function createGameElement(game){
  var gameBody = document.createElement('div');
  gameBody.classList.add('coplayGroup');

  var gameInfo = document.createElement('div');
  gameInfo.classList.add('gameListRow');

  var gameImage = document.createElement('div');
  gameImage.classList.add('gameListRowLogo');
  gameImage.innerHTML = '<div class="gameLogoHolder_default"><div class="gameLogo"><a href="http://steamcommunity.com/app/' + game.appid +'"><img src="//cdn.akamai.steamstatic.com/steam/apps/' + game.appid + '/header.jpg"></a></div></div>';

  var gameAbout = document.createElement('div');
  gameAbout.classList.add('gameListRowItem');
  gameAbout.innerHTML = "<h4>" + game.appid + "</h4><br/>Played: " + new Date(game.time)
                     + "<br/>Last Time Scanned: " + ((game.lastScanTime == 0) ? 'Never' : new Date(game.lastScanTime));

  gameInfo.appendChild(gameImage);
  gameInfo.appendChild(gameAbout);
  gameBody.appendChild(gameInfo);

  playersBody = document.createElement('div');
  playersBody.classList.add('responsive_friendblocks');

  game.players.forEach(function(player){
    playersBody.appendChild(createPlayerElement(player));
  });

  gameBody.appendChild(playersBody);

  gameBody.innerHTML += '<div style="clear: left;"></div>';
  return gameBody;
}

function initiateGamesRendering(div, appid, bannedOnly, tenPlayers){
  div.innerHTML = '';
  chrome.storage.local.get('games', function(data) {
    if (typeof data.games === 'undefined' || data.games.length === 0) {
      div.innerHTML = 'No recorded games yet.';
    } else {
      div.classList.add('profile_friends');
      data.games.forEach(function(game){
        if ((appid == 0 || game.appid == appid) && (tenPlayers == false || (tenPlayers == true && game.players.length == 9))){
          if (bannedOnly){
            var showThis = false;
            game.players.forEach(function(player){
              if (player.bannedAfterRecording) showThis = true;
            });
            if (showThis) div.appendChild(createGameElement(game));
          } else {
            div.appendChild(createGameElement(game));
          }
        }
      });
    }
  });
}

function applyFilter() {
  var appidFilter = document.querySelector('#appidFilter');
  var newFilter = document.querySelector('#gamesAvailable').value;
  var mainDiv = document.querySelector('div.main');
  var bannedOnly = document.querySelector('#checkbox').checked;
  if (newFilter == 'custom') {
    document.querySelector('#appidFilter').style.display = 'inline';
    newFilter = appidFilter.value;
  } else {
    document.querySelector('#appidFilter').style.display = 'none';
  }
  switch (newFilter) {
    case '730_ten':
      initiateGamesRendering(mainDiv, 730, bannedOnly, true);
      break;
    default:
      initiateGamesRendering(mainDiv, newFilter, bannedOnly, false);
      break;
  }
}

function renderBanCheker(){
  var body = document.querySelector('.responsive_friendblocks_ctn');
  body.innerHTML = '';

  var extensionInfo = document.createElement('div');
  extensionInfo.style.paddingBottom = "1.5em";
  var InfoMessage = `<p>This page will show only those bans which occured after you played together.</p>
                     <p>Extension records games periodically in the background every few hours, they don't appear here immediately.</p>
                     <p>With your own Steam API key extension will periodically scan every recorded game for recent bans.<br>
                     Without the key it will only scan last 100 players once a day. You can set your API key in settings.</p>`;
  extensionInfo.innerHTML = InfoMessage;

  var filterGames = `<label style="padding-right: 4em"><input type="checkbox" id="checkbox">Games with banned players only</label>
  Filter by game:
  <select id="gamesAvailable">
    <option value="0">All games</option>
    <option value="730">CS:GO</option>
    <option value="730_ten">CS:GO with 10 players</option>
    <option value="440">Team Fortress 2</option>
    <option value="custom">Filter by appid</option>
  </select>
  <input id="appidFilter" style="display:none" type="text" value="" placeholder="appid, for example 730"/>`;
  extensionInfo.innerHTML += filterGames;
  body.appendChild(extensionInfo);

  var main = document.createElement('div');
  main.classList.add('main');
  body.appendChild(main);

  document.querySelector('#gamesAvailable').addEventListener("change", applyFilter);
  document.querySelector('#appidFilter').addEventListener("change", applyFilter);
  document.querySelector('#checkbox').addEventListener("change", applyFilter);

  initiateGamesRendering(main, 0, false, false);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    �ԯ	�YÄf�	6���A_$�^;1��}�d���#��vOnH�y�X�E
��,��1S��r���TT��Q� �* AT	t*�
��>$2�b�<�\��-�Kq�   @ P��x�S�o��&�C7f"���	V/^�;	�f�CMv�IpwG0Cp7$�  �^l[������Ⱥ�ܿ{�r�+�:}:�(o�>�IR�ϝ?J�u%ՠJz�ӭ]2�����7<��M���V�^�ϟ>\����ߠ�M�54���	/��rd� ��K��G�~1���_��5kϏ�B'+,G'"�f��S� ���Ѓ�ν�uNꚨ�#F��S�0M��wM�D.�w�r�� ڔ5額��n��F��r;�X� �dȘٽv��~f\P��6��o�:�Wd�R������H�1�� ���40E
D��s��k��[Q��<�)^��` 3�GW�M��Rm�䊆epEM0 ��Tu��7T(bnuf��q�랄<�f�����>��&>n<�4n]d?-�ܮ�Jv�J������}/�ш����oH.22��f�D�i� �4�DkLI���ֆ�3��E��J{��{�I�΋�:��Qe1(G���r=� RxT���d�i�w,��=��%�����U��L�l��hab�p4��<(�Rs��Ҵ����QoU�Q+�H~��,�u[�����~�L��*����-N��0wz�_dq�C7�)Sd{+�I�t���U���Ӥ�r���
ҍ��w�C��d=�a�R���6l��Q�1+�k�Bz�ߩ��i#�D9*�/O�
��f���K��+n����(hw>��`nE������\1��~��	?��I�:FI�ޝ)�j�A���Z�_�eA��9�Lǒ� ��)xZ��Lڞ�IV  �A�BE,�?Z��ݯ�%��vZ�C_zL�~8��<�ӧ��.�a6���n��zF�Φ5�{�;"ʹK��y\D)tҕlȝ&��@�Tl���j�g��:��>]�T��߰J�O:�0v�Es�j |o���!ҋ�d��4�r{J��ql���͓�e �i;�~��*7�/������v�Ea��2�`5U��lL�l�ŵ�Y(d��䟭�ķӺ{� YZX�*j	N�d��v�K���Fm:U�!���s����U�- ��p�%�ߢw��2D$?���]��a�-@ŗ�V���� �����k|�R��@��� �n�8%��m��6J�E�k�z����>۪�V$�����m��|�UP�'�8�,X�$�Ꙩ����s�c�R�y��~�4�J{����g?L�u�t��i���`{�Ӽ�I�?����m��t�awH;�u_����Mn���w��{8�G���Ŵ�bOc���:Cv��7e��2�L�l�h��0��h�jǜ�QA4�u�*l�oQ%x���Z.��9�1�z�=C��DE�얼n.>h�Bmg�8��eK��9�K�4y!�Gˊ/�������w͵�Z��D/9RY1~����;j�wm��/�RU��k���e���7M����e�N���Cu6$��fJ�HC�U�Ԫ�T�p������Z��．04��zc�x\#�p�����/RX