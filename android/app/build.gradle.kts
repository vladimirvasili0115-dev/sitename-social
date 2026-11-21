plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.ravetill.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.ravetill.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 4
        versionName = "1.3"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Notifications while the app is closed (Firebase Cloud Messaging).
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-messaging")
}
