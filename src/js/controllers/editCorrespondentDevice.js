'use strict';

angular.module('ringnetworkApp.controllers').controller('editCorrespondentDeviceController',
	function ($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService, gettextCatalog) {

		var self = this;

		var fc = profileService.focusedClient;
		$scope.backgroundColor = fc.backgroundColor;
		var correspondent = correspondentListService.currentCorrespondent;
		$scope.correspondent = correspondent;
		$scope.name = correspondent.name;
		$scope.hub = correspondent.hub;

		$scope.save = function () {
			$scope.error = null;
			correspondent.name = $scope.name;
			correspondent.hub = $scope.hub;
			var device = require('rng-core/wallet/device.js');
			device.updateCorrespondentProps(correspondent, function () {
				go.path('correspondentDevices.correspondentDevice');
			});
		};


// 清除聊天记录
		$scope.purge_chat = function () {
			var ModalInstanceCtrl = function ($scope, $modalInstance, $sce, gettext) {
				$scope.title = $sce.trustAsHtml(gettextCatalog.getString('Delete the whole chat history with {{ name }} ?', { name: correspondent.name}));

				$scope.ok = function () {
					$modalInstance.close(true);
					go.path('correspondentDevices.correspondentDevice');

				};
				$scope.cancel = function () {
					$modalInstance.dismiss('cancel');
					go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
				};
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/confirmation.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl
			});

			modalInstance.result.finally(function () {
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});

			modalInstance.result.then(function (ok) {
				if (ok) {
					var chatStorage = require('rng-core/db/chat_storage.js');
					chatStorage.purge(correspondent.device_address);
					correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
				}

			});
		}
// 清除历史记录 结束

		function setError(error) {
			$scope.error = error;
		}


	});
