var optin_landing = {
	init: function() {
		var self = this;

		navigator.vibrate = navigator.vibrate || 
							navigator.webkitVibrate || 
							navigator.msVibrate;


		self.initMainScripts();
	},

	initMainScripts: function() {
		var self = this,
			$fields = $(".field"),
			sucess = false;

		$fields.each(function() {
			var $this = $(this);

			$this.on("focusout", function() {
				self.validateForm($this, sucess);
			});
		});

	},

	validateForm: function($this, sucess) {
		var self = this,
			regex_email = /[^\.@]+@[^\.@]+\./;

		if ($this.attr("id") == "email") sucess = self.validateFields($this, regex_email, sucess);
		else sucess = self.validateFields($this, "", sucess);
	},

	validateFields: function($field, reg_ex, vaid_value) {
		var self = this;

		if ($field.attr("type") != "checkbox" && $field.val() != "") {
			if (reg_ex != null && reg_ex != "") {
				if ($field.val().match(reg_ex)) {
					self.validAction($field);
				} else {
					self.errorAction($field, vaid_value);
				}
			} else {
				self.validAction($field);
			}
		} else if ($field.attr("type") == "checkbox") {
			if ($field.prop('checked') == true) {
				self.validAction($field);
			} else {
				self.errorAction($field, vaid_value);
			}
		} else {
			self.errorAction($field, vaid_value);
		}

		return vaid_value;
	},

	errorAction: function($field, vaid_value) {
		if (navigator.vibrate != undefined) {
            navigator.vibrate(1000);
        	//navigator.vibrate([150, 100, 150, 100]);
        }

		vaid_value = false;
		$field.addClass("error--field");
		$field.next().css("display","inline-block");
	},

	validAction: function($field) {
		$field.removeClass("error--field");
		$field.next().hide();
	}
};

optin_landing.init();
