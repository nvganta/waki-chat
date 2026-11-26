package com.wakialarm.alarm

import com.facebook.react.bridge.ReactMethod
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * React Native's TurboModule interop refuses to load a module whose async @ReactMethod
 * returns a value, and the app then crashes on launch. Only methods marked
 * isBlockingSynchronousMethod may return something.
 */
class AlarmModuleContractTest {
    @Test fun asyncReactMethodsReturnNothing() {
        val methods = AlarmModule::class.java.declaredMethods
            .filter { it.isAnnotationPresent(ReactMethod::class.java) }
        assertTrue("expected the module to expose React methods", methods.isNotEmpty())
        val offenders = methods
            .filter { !it.getAnnotation(ReactMethod::class.java)!!.isBlockingSynchronousMethod }
            .filter { it.returnType != Void.TYPE }
            .map { "${it.name} returns ${it.returnType.simpleName}" }
        assertEquals(emptyList<String>(), offenders)
    }
}
