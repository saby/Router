/* global testing */
testing.configure = function () {
   mocha.globals(['Stomp']); // 'Core/i18n подписываеться на серверное событие, падают тесты'
   mocha.checkLeaks();
};
