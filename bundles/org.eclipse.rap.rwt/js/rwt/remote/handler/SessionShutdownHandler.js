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

rwt.remote.HandlerRegistry.add( "rwt.client.SessionShutdown", {

  factory : function() {
    return rwt.client.SessionShutdown.getInstance();
  },

  service : true,

  destructor : rwt.util.Functions.returnTrue,

  methods : [
    "requestShutdown"
  ],

  methodHandler : {
    "requestShutdown" : function( object ) {
      object.requestShutdown();
    }
  }

} );
