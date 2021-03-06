'use strict';

var breadcrumbs = require('rng-core/base/breadcrumbs.js');

angular.module('ringnetworkApp.directives').directive('qrScannerCold', ['$rootScope', '$timeout', '$modal', 'isCordova', 'gettextCatalog', function ($rootScope, $timeout, $modal, isCordova, gettextCatalog) {

	var controller = function ($scope) {

		// 移动端的 相机
		$scope.cordovaOpenScanner = function () {
			window.ignoreMobilePause = true;
			window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
			$timeout(function () {
				cordova.plugins.barcodeScanner.scan(
					function onSuccess(result) {
						$timeout(function () {
							window.plugins.spinnerDialog.hide();
							window.ignoreMobilePause = false;
						}, 100);
						if (result.cancelled) return;

						$timeout(function () {
							var data = result.text;
							$scope.onScan({data: data});
						}, 1000);
					},
					function onError(error) {
						$timeout(function () {
							window.ignoreMobilePause = false;
							window.plugins.spinnerDialog.hide();
						}, 100);
						alert(gettextCatalog.getString('Please allow RingNetwork to access your camera'));
					}
				);
				if ($scope.beforeScan) {
					$scope.beforeScan();
				}
			}, 100);
		};


		// 电脑端的 相机
		$scope.modalOpenScanner = function () {
			var parentScope = $scope;
			var ModalInstanceCtrl = function ($scope, $rootScope, $modalInstance) {
				// QR code Scanner
				var video;
				var canvas;
				var $video;
				var context;
				var localMediaStream;
				var prevResult;

				var _scan = function (evt) {
					if (localMediaStream) { // 本地媒体流
						context.drawImage(video, 0, 0, 300, 225);
						try {
							qrcode.decode();
						} catch (e) {
							//qrcodeError(e);
						}
					}
					$timeout(_scan, 800);
				};

				var _scanStop = function () {
					if (localMediaStream && localMediaStream.active) {
						var localMediaStreamTrack = localMediaStream.getTracks();
						for (var i = 0; i < localMediaStreamTrack.length; i++) {
							localMediaStreamTrack[i].stop();
						}
					} else {
						try {
							localMediaStream.stop();
						} catch (e) {
							// Older Chromium not support the STOP function
						}
						;
					}
					localMediaStream = null;
					if (video)
						video.src = '';
				};

				qrcode.callback = function (data) {
					if (prevResult != data) {
						prevResult = data;
						return;
					}
					_scanStop();
					$modalInstance.close(data);
				};

				var _successCallback = function (stream) {
					video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
					localMediaStream = stream;
					video.play();
					$timeout(_scan, 1000);
				};

				var _videoError = function (err) {
					breadcrumbs.add('qr scanner video error');
					$scope.cancel();
				};

				var setScanner = function () {

					navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

					window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
				};

				$scope.init = function () {
					setScanner();
					$timeout(function () {
						if (parentScope.beforeScan) {
							parentScope.beforeScan();
						}
						canvas = document.getElementById('qr-canvas');
						if (!canvas)
							return;
						context = canvas.getContext('2d');


						video = document.getElementById('qrcode-scanner-video');
						$video = angular.element(video);
						canvas.width = 300;
						canvas.height = 225;
						context.clearRect(0, 0, 300, 225);

						navigator.getUserMedia({
							video: true
						}, _successCallback, _videoError);
					}, 500);
				};

				$scope.cancel = function () {
					breadcrumbs.add('qr scanner cancel');
					_scanStop();
					try {
						$modalInstance.dismiss('cancel');
					}
					catch (e) {
						e.bIgnore = true;
						//	throw e;
					}
				};
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/scanner.html',
				windowClass: 'full',
				controller: ModalInstanceCtrl,
				backdrop: 'static',
				keyboard: false
			});
			modalInstance.result.then(function (data) {
				parentScope.onScan({data: data});
			});

		};

		// 打开扫描仪 （ 相机 ）
		$scope.openScanner = function () {
			// 移动端的 相机
			if (isCordova) {
				$scope.cordovaOpenScanner();
			}
			// 电脑端的 相机
			else {
				$scope.modalOpenScanner();
			}
		};
	};


	// 返回一个 指令定义 对象
	return {
		restrict: 'E',  // element
		scope: {
			onScan: "&",
			beforeScan: "&"
		},
		controller: controller,  // 引入上面定义的controller
		replace: true,
		template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-24"></i></a>'
	}
}
]);
