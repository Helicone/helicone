
    #![allow(dead_code)]

    #[track_caller]
    fn foo() {
        let _location = std::panic::Location::caller();
    }
