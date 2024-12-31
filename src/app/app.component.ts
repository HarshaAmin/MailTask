import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
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
      'https://novigosolutionspvtltd4-dev-ed.develop.my.salesforce.com',
      'https://novigosolutionspvtltd4-dev-ed.develop.my.salesforce-sites.com/',
      'https://service.force.com',
      '00DQy00000HrBQA',
      'SendTechEmailChat',
      {
        baseLiveAgentContentURL:
          'https://c.la11-core1.sfdc-cehfhs.salesforceliveagent.com/content',
        deploymentId: '572Qy00000ALBNh',
        buttonId: '573Qy000002ucUT',
        baseLiveAgentURL:
          'https://d.la11-core1.sfdc-cehfhs.salesforceliveagent.com/chat',
        eswLiveAgentDevName:
          'EmbeddedServiceLiveAgent_Parent04IQy0000003iSjMAI_1941b59fe21',
        isOfflineSupportEnabled: false
      }
    );

    window['embedded_svc'].initialized = true; // Flag the initialization
  }
}
