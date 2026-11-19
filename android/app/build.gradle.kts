plugins {
    id("com.android.application")
}

android {
    namespace = "com.ravetill.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.ravetill.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 2
        versionName = "1.1"
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
