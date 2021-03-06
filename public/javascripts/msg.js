(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'Messenger'));

  window.extAsyncInit = function() {
    // the Messenger Extensions JS SDK is done loading 
    const backToMessenger = document.getElementById('back-to-messenger');
    backToMessenger.onclick = (event) => {
      if(MessengerExtensions){
        MessengerExtensions.getSupportedFeatures(function success(result) {
          let features = result.supported_features;
          if(features.hasOwnProperty("context"))
          {
            MessengerExtensions.requestCloseBrowser(function success() {
              // webview closed
            }, function error(err) {
              alert(err)
              // an error occurred
            });
          }
        }, function error(err) {
          // error retrieving supported features
          alert(err)
        })
      } 
    }
  };