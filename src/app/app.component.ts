import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ngOnInit(): void {
    this.loadChatScript(); // Load the chat script when the component initializes
  }
  loadChatScript(): void {
    // Check if the script is already included
    if (
      !document.querySelector(
        'script[src="https://service.force.com/embeddedservice/5.0/esw.min.js"]'
      )
    ) {
      const script = document.createElement('script');
      script.src = 'https://service.force.com/embeddedservice/5.0/esw.min.js'; // Or use the local path
      script.async = true;
      script.onload = () => this.initChatService(); // Initialize once the script loads
      document.body.appendChild(script); // Append the script to the body
    }
  }

  initChatService(): void {
    // Only initialize once
    if (window['embedded_svc'] && window['embedded_svc'].initialized) {
      return; // Avoid reinitializing
    }

    window['embedded_svc'] = window['embedded_svc'] || {};
    const embedded_svc: any = window['embedded_svc'];

    embedded_svc.settings = embedded_svc.settings || {};
    embedded_svc.settings.displayHelpButton = true;
    embedded_svc.settings.language = 'en';
    embedded_svc.settings.enabledFeatures = ['LiveAgent'];
    embedded_svc.settings.entryFeature = 'LiveAgent';

    embedded_svc.init(
      'https://novigo9-dev-ed.develop.my.salesforce.com',
      'https://novigo9-dev-ed.develop.my.site.com/defaulthelpcenter3Jan',
      'https://service.force.com',
      '00DNS000009pWQT',
      'Queue_Chat',
      {
        baseLiveAgentContentURL:
          'https://c.la11-core1.sfdc-y37hzm.salesforceliveagent.com/content',
        deploymentId: '572NS000006v0np',
        buttonId: '573NS000001L43F',
        baseLiveAgentURL:
          'https://d.la11-core1.sfdc-y37hzm.salesforceliveagent.com/chat',
        eswLiveAgentDevName: 'Queue_Chat',
        isOfflineSupportEnabled: false
      }
    );

    window['embedded_svc'].initialized = true; // Flag the initialization
  }
}
