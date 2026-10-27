# YallaDars ProGuard Rules
-keep class com.yalladars.app.data.model.** { *; }
-keep class com.yalladars.app.data.remote.** { *; }
-keepattributes Signature, InnerClasses, EnclosingMethod
-dontwarn retrofit2.**
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
