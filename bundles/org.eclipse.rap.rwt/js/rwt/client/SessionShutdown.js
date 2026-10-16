/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

namespace( "rwt.client" );

rwt.client.SessionShutdown = function() {

  this.requestShutdown = function() {
    // after the current response has been processed, otherwise the request would be composed in
    // the middle of the one that is being handled
    window.setTimeout( function() {
      var connection = rwt.remote.Connection.getInstance();
      connection.getMessageWriter().appendHead( "shutdown", true );
      connection.sendImmediate( true );
    }, 0 );
  };

};

rwt.client.SessionShutdown.getInstance = function() {
  return rwt.runtime.Singletons.get( rwt.client.SessionShutdown );
};
