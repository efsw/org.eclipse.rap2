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

rwt.define( "rwt.scripting", {} );

(function(){

// TODO [rst] Define directly using rwt.define, remove surrounding function scope
rwt.scripting.FunctionFactory = {

  // ClientListener and ClientFunction turn source sent by the server into a function, which takes
  // "eval" and therefore a content security policy with 'unsafe-eval'. Nothing in this product
  // uses them - a listener that has to run in the client is written in a page and reached with
  // Browser#call - so the factory refuses instead of keeping that door open for everybody.
  createFunction : function( functionScript, name ) {
    throw new Error( "Client scripting is disabled: cannot create the function " + name + "." );
  }

};

}());
