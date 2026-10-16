/*******************************************************************************
 * Copyright (c) 2012, 2014 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

namespace( "rwt.client" );

rwt.client.JavaScriptExecutor = function() {

  this.execute = function() {
    // Running source written by the server needs "eval", which is precisely what a content
    // security policy without 'unsafe-eval' forbids. What used to be said as a script is now said
    // as a call: Browser#call reaches a function of a browser widget's document, and a client
    // service does the rest - UrlNavigator to leave for another address, SessionShutdown to end
    // the session. The service refuses rather than running code, so that what is left of the old
    // way shows itself here instead of waiting for the policy to be turned on.
    throw new Error( "JavaScriptExecutor is disabled: use Browser#call or a client service." );
  };

};

rwt.client.JavaScriptExecutor.getInstance = function() {
  return rwt.runtime.Singletons.get( rwt.client.JavaScriptExecutor );
};
