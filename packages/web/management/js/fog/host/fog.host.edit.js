(function($) {
    // ---------------------------------------------------------------
    // GENERAL TAB
    var originalName = $("#name").val(),
        updateName = function(newName) {
            var e = $("#pageTitle"),
                text = e.text();
            text = text.replace(": " + originalName, ": " + newName);
            document.title = text;
            e.text(text);
        };

    $('#name').inputmask({mask: Common.masks.hostname, repeat: 15});
    $('#mac').inputmask({mask: Common.masks.mac});
    $('#productKey').inputmask({mask: Common.masks.productKey});

    var generalForm = $('#host-general-form'),
        generalFormBtn = $('#general-send'),
        generalDeleteBtn = $('#general-delete');

    generalForm.on('submit',function(e) {
        e.preventDefault();
    });
    generalFormBtn.on('click',function() {
        generalFormBtn.prop('disabled', true);
        generalDeleteBtn.prop('disabled', true);
        Common.processForm(generalForm, function(err) {
            generalFormBtn.prop('disabled', false);
            generalDeleteBtn.prop('disabled', false);
            if (err) {
                return;
            }
            updateName($('#name').val())
            originalName = $('#name').val();
        });
    });
    generalDeleteBtn.on('click',function() {
        generalFormBtn.prop('disabled', true);
        generalDeleteBtn.prop('disabled', true);
        Common.massDelete(
            null,
            function(err) {
                if (err) {
                    generalDeleteBtn.prop('disabled', false);
                    generalFormBtn.prop('disabled', false);
                    return;
                }
                window.location = '../management/index.php?node='+Common.node+'&sub=list';
            });
    });

    // ---------------------------------------------------------------
    // ACTIVE DIRECTORY TAB
    var ADForm = $('#active-directory-form'),
        ADFormBtn = $('#ad-send'),
        ADClearBtn = $('#ad-clear');

    ADForm.on('submit',function(e) {
        e.preventDefault();
    });
    ADFormBtn.on('click',function() {
        ADFormBtn.prop('disabled', true);
        ADClearBtn.prop('disabled', true);
        Common.processForm(ADForm, function(err) {
            ADFormBtn.prop('disabled', false);
            ADClearBtn.prop('disabled', false);
        });
    });
    ADClearBtn.on('click',function() {
        ADClearBtn.prop('disabled', true);
        ADFormBtn.prop('disabled', true);

        var restoreMap = [];
        ADForm.find('input[type="text"], input[type="password"], textarea').each(function(i, e) {
            restoreMap.push({checkbox: false, e: e, val: $(e).val()});
            $(e).val('');
            $(e).prop('disabled', true);
        });
        ADForm.find('input[type=checkbox]').each(function(i, e) {
            restoreMap.push({checkbox: true, e: e, val: $(e).iCheck('update')[0].checked});
            $(e).iCheck('uncheck');
            $(e).iCheck('disable');
        });

        ADForm.find('input[type=text], input[type=password], textarea').val('');
        ADForm.find('input[type=checkbox]').iCheck('uncheck');

        Common.processForm(ADForm, function(err) {
            for (var i = 0; i < restoreMap.length; i++) {
                field = restoreMap[i];
                if (field.checkbox) {
                    if (err) $(field.e).iCheck((field.val ? 'check' : 'uncheck'));
                    $(field.e).iCheck('enable');
                } else {
                    if (err) $(field.e).val(field.val);
                    $(field.e).prop('disabled', false);
                }
            }
            ADClearBtn.prop('disabled', false);
            ADFormBtn.prop('disabled', false);
        });
    });

    // ---------------------------------------------------------------
    // PRINTER TAB
    var printerConfigForm = $('#printer-config-form'),
        printerConfigBtn = $('#printer-config-send'),
        printerAddBtn = $('#printer-add'),
        printerDefaultBtn = $('#printer-default'),
        printerRemoveBtn = $('#printer-remove'),
        DEFAULT_PRINTER_ID = -1;

    printerAddBtn.prop('disabled', true);
    printerRemoveBtn.prop('disabled', true);

    function onPrintersSelect(selected) {
        var disabled = selected.count() == 0;
        printerAddBtn.prop('disabled', disabled);
        printerRemoveBtn.prop('disabled', disabled);
    }

    var printersTable = Common.registerTable($('#host-printers-table'), onPrintersSelect, {
        order: [
            [1, 'asc']
        ],
        columns: [
            {data: 'isDefault'},
            {data: 'name'},
            {data: 'config'},
            {data: 'association'}
        ],
        rowId: 'id',
        columnDefs: [
            {
                responsivePriority: -1,
                render: function(data, type, row) {
                    var checkval = '';
                    if (row.isDefault) {
                        checkval = ' checked';
                    }
                    return '<div class="radio">'
                        + '<input belongsto="defaultPrinters" type="radio" class="default" name="default" id="printer_'
                        + row.id
                        + '" value="' + row.id + '"'
                        + ' wasoriginaldefault="'
                        + checkval
                        + '" '
                        + checkval
                        + '/>'
                        + '</div>';
                },
                targets: 0,
            },
            {
                responsivePriority: 0,
                render: function(data, type, row) {
                    return '<a href="../management/index.php?node=printer&sub=edit&id=' + row.id + '">' + data + '</a>';
                },
                targets: 1

            },
            {
                render: function(data, type, row) {
                    return row.config == 'Local' ? 'TCP/IP' : row.config;
                },
                targets: 2
            },
            {
                render: function(data, type, row) {
                    var checkval = '';
                    if (row.association === 'associated') {
                        checkval = ' checked';
                    }
                    return '<div class="checkbox">'
                        + '<input type="checkbox" class="associated" name="associate[]" id="printerAssoc_'
                        + row.id
                        + '" value="' + row.id + '"'
                        + checkval
                        + '/>'
                        + '</div>';
                },
                targets: 3
            }

        ],
        processing: true,
        serverSide: true,
        ajax: {
            url: '../management/index.php?node='+Common.node+'&sub=getPrintersList&id='+Common.id,
            type: 'post'
        }
    });

    printersTable.on('draw', function() {
        Common.iCheck('#host-printers input');
        $('#host-printers-table input.default').on('ifClicked', onRadioSelect);
    });
    printerDefaultBtn.prop('disabled', true);

    var onRadioSelect = function(event) {
        if($(this).attr('belongsto') === 'defaultPrinters') {
            var id = parseInt($(this).val());
            if(DEFAULT_PRINTER_ID === -1 && $(this).attr('wasoriginaldefault') === ' checked') {
                DEFAULT_PRINTER_ID = id;
            }
            if (id === DEFAULT_PRINTER_ID) {
                $(this).iCheck('uncheck');
                DEFAULT_PRINTER_ID = 0;
            } else {
                DEFAULT_PRINTER_ID = id;
            }
            printerDefaultBtn.prop('disabled', false);
        }
    };

    // Setup default printer watcher
    $('.default').on('ifClicked', onRadioSelect);

    printerDefaultBtn.on('click',function() {
        printerAddBtn.prop('disabled', true);
        printerRemoveBtn.prop('disabled', true);

        var method = printerDefaultBtn.attr('method'),
            action = printerDefaultBtn.attr('action'),
            opts = {
                'defaultsel': '1',
                'default': DEFAULT_PRINTER_ID
            };

        Common.apiCall(method,action, opts, function(err) {
            printerDefaultBtn.prop('disabled', !err);
            onPrintersSelect(printersTable.rows({selected: true}));
        });
    });

    printerConfigForm.serialize2 = printerConfigForm.serialize;
    printerConfigForm.serialize = function() {
        return printerConfigForm.serialize2() + '&levelup';
    }
    printerConfigForm.on('submit',function(e) {
        e.preventDefault();
    });
    printerConfigBtn.on('click', function() {
        printerConfigBtn.prop('disabled', true);
        Common.processForm(printerConfigForm, function(err) {
            printerConfigBtn.prop('disabled', false);
        });
    });
    printerAddBtn.on('click',function() {
        printerAddBtn.prop('disabled', true);

        var method = printerAddBtn.attr('method'),
            action = printerAddBtn.attr('action'),
            rows = printersTable.rows({selected: true}),
            toAdd = Common.getSelectedIds(printersTable),
            opts = {
                'updateprinters': '1',
                'printer': toAdd
            };

        Common.apiCall(method,action,opts,function(err) {
            if (!err) {
                printersTable.draw(false);
                printersTable.rows({
                    selected: true
                }).remove().draw(false);
                printersTable.rows({selected: true}).deselect();
            } else {
                printerAddBtn.prop('disabled', false);
            }
        });
    });

    printerRemoveBtn.on('click',function() {
        printerAddBtn.prop('disabled', true);
        printerRemoveBtn.prop('disabled', true);
        printerDefaultBtn.prop('disabled', true);

        var method = printerRemoveBtn.attr('method'),
            action = printerRemoveBtn.attr('action'),
            rows = printersTable.rows({selected: true}),
            toRemove = Common.getSelectedIds(printersTable),
            opts = {
                'printdel': '1',
                'printerRemove': toRemove
            };

        Common.apiCall(method,action,opts,function(err) {
            printerDefaultBtn.prop('disabled', false);
            if (!err) {
                printersTable.draw(false);
                printersTable.rows({
                    selected: true
                }).remove().draw(false);
                printersTable.rows({selected: true}).deselect();
            } else {
                printerRemoveBtn.prop('disabled', false);
            }
        });
    });

    if (Common.search && Common.search.length > 0) {
        printersTable.search(Common.search).draw();
    }

    // ---------------------------------------------------------------
    // SNAPINS TAB
    var snapinsAddBtn = $('#snapins-add'),
        snapinsRemoveBtn = $('#snapins-remove');

    snapinsAddBtn.prop('disabled', true);
    snapinsRemoveBtn.prop('disabled', true);

    function onSnapinsSelect(selected) {
        var disabled = selected.count() == 0;
        snapinsAddBtn.prop('disabled', disabled);
        snapinsRemoveBtn.prop('disabled', disabled);
    }

    var snapinsTable = Common.registerTable($('#host-snapins-table'), onSnapinsSelect, {
        columns: [
            {data: 'name'},
            {data: 'createdTime'},
            {data: 'association'}
        ],
        rowId: 'id',
        columnDefs: [
            {
                responsivePriority: -1,
                render: function(data, type, row) {
                    return '<a href="../management/index.php?node=snapin&sub=edit&id=' + row.id +'">' + data + '</a>';
                },
                targets: 0

            },
            {
                render: function(data, type, row) {
                    var checkval = '';
                    if (row.association === 'associated') {
                        checkval = ' checked';
                    }
                    return '<div class="checkbox">'
                        + '<input type="checkbox" class="associated" name="associate[]" id="snapinAssoc_'
                        + row.id
                        + '" value="' + row.id + '"'
                        + checkval
                        + '/>'
                        + '</div>';
                },
                targets: 2
            }
        ],
        processing: true,
        serverSide: true,
        ajax: {
            url: '../management/index.php?node='+Common.node+'&sub=getSnapinsList&id='+Common.id,
            type: 'post'
        }
    });
    snapinsTable.on('draw', function() {
        Common.iCheck('#host-snapins input');
    });

    snapinsAddBtn.on('click',function() {
        snapinsAddBtn.prop('disabled', true);
        snapinsRemoveBtn.prop('disabled', true);

        var method = $(this).attr('method'),
            action = $(this).attr('action'),
            rows = snapinsTable.rows({selected: true}),
            toAdd = Common.getSelectedIds(snapinsAddTable),
            opts = {
                'updatesnapins': '1',
                'snapin': toAdd
            };
        Common.apiCall(method,action,opts,function(err) {
            if (!err) {
                snapinsTable.draw(false);
                snapinsTable.rows({
                    selected: true
                }).remove().draw(false);
                snapinsTable.rows({selected: true}).deselect();
            } else {
                snapinsAddBtn.prop('disabled', false);
            }
        });
    });

    snapinsRemoveBtn.on('click',function() {
        snapinsRemoveBtn.prop('disabled', true);
        var method = $(this).attr('method'),
            action = $(this).attr('action'),
            rows = snapinsTable.rows({selected: true}),
            toRemove = Common.getSelectedIds(snapinsTable),
            opts = {
                'snapdel': '1',
                'snapinRemove': toRemove
            };
        Common.apiCall(method,action,opts,function(err) {
            if (!err) {
                snapinsTable.draw(false);
                snapinsTable.rows({
                    selected: true
                }).remove().draw(false);
                snapinsTable.rows({selected: true}).deselect();
            } else {
                snapinsRemoveBtn.prop('disabled', false);
            }
        });
    });
    if (Common.search && Common.search.length > 0) {
        snapinsTable.search(Common.search).draw();
    }

    // ---------------------------------------------------------------
    // SERVICE TAB
    var modulesEnableBtn = $('#modules-enable'),
        modulesDisableBtn = $('#modules-disable'),
        modulesUpdateBtn = $('#modules-update');

    function onModulesDisable(selected) {
        var disabled = selected.count() == 0;
        modulesDisableBtn.prop('disabled', disabled);
    }
    function onModulesEnable(selected) {
        var disabled = selected.count() == 0;
        modulesEnableBtn.prop('disabled', disabled);
    }

    modulesEnableBtn.on('click', function(e) {
        e.preventDefault();
        $('#modules-to-update_wrapper .buttons-select-all').trigger('click');
        $('#modules-to-update_wrapper .associated').iCheck('check');
        $(this).prop('disabled', true);
        modulesDisableBtn.prop('disabled', false);
    });
    modulesDisableBtn.on('click', function(e) {
        e.preventDefault();
        $('#modules-to-update_wrapper .buttons-select-none').trigger('click');
        $('#modules-to-update_wrapper .associated').iCheck('uncheck');
        $(this).prop('disabled', true);
        modulesEnableBtn.prop('disabled', false);
    });

    var modulesTable = Common.registerTable($("#modules-to-update"), onModulesEnable, {
        columns: [
            {data: 'name'},
            {data: 'association'}
        ],
        rowId: 'id',
        columnDefs: [
            {
                responsivePriority: -1,
                render: function(data, type, row) {
                    return row.name;
                },
                targets: 0

            },
            {
                render: function(data, type, row) {
                    var checkval = '';
                    if (row.association === 'associated') {
                        checkval = ' checked';
                    }
                    return '<div class="checkbox">'
                        + '<input type="checkbox" class="associated" name="associate[]" id="moduleAssoc_'
                        + row.id
                        + '" value="' + row.id + '"'
                        + checkval
                        + '/>'
                        + '</div>';
                },
                targets: 1
            }
        ],
        processing: true,
        serverSide: true,
        ajax: {
            url: '../management/index.php?node='+Common.node+'&sub=getModulesList&id='+Common.id,
            type: 'post'
        }
    });
    modulesTable.on('draw', function() {
        Common.iCheck('#modules-to-update input');
    });
    if (Common.search && Common.search.length > 0) {
        modulesTable.search(Common.search).draw();
    }
})(jQuery);
// var LoginHistory = $('#login-history'),
//     LoginHistoryDate = $('.loghist-date'),
//     LoginHistoryData = [],
//     Labels = [],
//     LabelData = [],
//     LoginData = [],
//     LoginDateMin = [],
//     LoginDateMax = [];
// function UpdateLoginGraph() {
//     url = location.href.replace('edit','hostlogins');
//     dte = LoginHistoryDate.val();
//     $.post(
//         url,
//         {
//             dte: dte
//         },
//         function(data) {
//             UpdateLoginGraphPlot(data);
//         }
//     );
// }
// function UpdateLoginGraphPlot(gdata) {
//     gdata = $.parseJSON(gdata);
//     if (gdata === null) {
//         return;
//     }
//     j = 0;
//     $.each(data, function (index, value) {
//         min1 = new Date(value.min * 1000).getTime();
//         max1 = new Date(value.max * 1000).getTime();
//         min2 = new Date(value.min * 1000).getTimezoneOffset() * 60000;
//         max2 = new Date(value.max * 1000).getTimezoneOffset() * 60000;
//         log1 = new Date(value.login * 1000).getTime();
//         log2 = new Date(value.login * 1000).getTimezoneOffset() * 60000;
//         loo1 = new Date(value.logout * 1000).getTime();
//         loo2 = new Date(value.logout * 1000).getTimezoneOffset() * 60000;
//         now = new Date();
//         LoginDateMin = new Date(min1 - min2);
//         LoginDateMax = new Date(max1 - max2);
//         LoginTime = new Date(log1 - log2);
//         LogoutTime = new Date(loo1 - loo2);
//         if (typeof(Labels) == 'undefined') {
//             Labels = new Array();
//             LabelData[index] = new Array();
//             LoginData[index] = new Array();
//         }
//         if ($.inArray(value.user,Labels) > -1) {
//             LoginData[index] = [LoginTime,$.inArray(value.user,Labels)+1,LogoutTime,value.user];
//         } else {
//             Labels.push(value.user);
//             LabelData[index] = [j+1,value.user];
//             LoginData[index] = [LoginTime,++j,LogoutTime,value.user];
//         }
//     });
//     LoginHistoryData = [{label: 'Logged In Time',data:LoginData}];
//     var LoginHistoryOpts = {
//         colors: ['rgb(0,120,0)'],
//         series: {
//             gantt: {
//                 active:true,
//                 show:true,
//                 barHeight:.2
//             }
//         },
//         xaxis: {
//             min: LoginDateMin,
//             max: LoginDateMax,
//             tickSize: [2,'hour'],
//             mode: 'time'
//         },
//         yaxis: {
//             min: 0,
//             max: LabelData.length + 1,
//             ticks: LabelData
//         },
//         grid: {
//             hoverable: true,
//             clickable: true
//         },
//         legend: {position: "nw"}
//     };
//     $.plot(LoginHistory, LoginHistoryData, LoginHistoryOpts);
// }
// (function($) {
//     LoginHistoryDate.on('change', function(e) {
//         this.form.submit();
//     });
//     $('#resetSecData').val('Reset Encryption Data');
//     resetEncData('hosts', 'host');
//     if (LoginHistory.length > 0) {
//         UpdateLoginGraph();
//     }
//     $('input:not(:hidden):checkbox[name="default"]').change(function() {
//         $(this).each(function(e) {
//             if (this.checked) this.checked = false;
//             e.preventDefault();
//         });
//         this.checked = false;
//     });
//     checkboxAssociations('.toggle-checkbox1:checkbox','.toggle-group1:checkbox');
//     checkboxAssociations('.toggle-checkbox2:checkbox','.toggle-group2:checkbox');
//     checkboxAssociations('#groupMeShow:checkbox','#groupNotInMe:checkbox');
//     checkboxAssociations('#printerNotInHost:checkbox','#printerNotInHost:checkbox');
//     checkboxAssociations('#snapinNotInHost:checkbox','#snapinNotInHost:checkbox');
//     checkboxAssociations('.toggle-checkboxprint:checkbox','.toggle-print:checkbox');
//     checkboxAssociations('.toggle-checkboxsnapin:checkbox','.toggle-snapin:checkbox');
//     checkboxAssociations('#rempowerselectors:checkbox','.rempoweritems:checkbox');
//     $('#groupMeShow:checkbox').on('change', function(e) {
//         if ($(this).is(':checked')) $('#groupNotInMe').show();
//         else $('#groupNotInMe').hide();
//         e.preventDefault();
//     });
//     $('#groupMeShow:checkbox').trigger('change');
//     $('#hostPrinterShow:checkbox').on('change', function(e) {
//         if ($(this).is(':checked')) {
//             $('.printerNotInHost').show();
//         } else {
//             $('.printerNotInHost').hide();
//         }
//         e.preventDefault();
//     });
//     $('#hostPrinterShow:checkbox').trigger('change');
//     $('#hostSnapinShow:checkbox').on('change', function(e) {
//         if ($(this).is(':checked')) {
//             $('.snapinNotInHost').show();
//         } else {
//             $('.snapinNotInHost').hide();
//         }
//         e.preventDefault();
//     });
//     $('#hostSnapinShow:checkbox').trigger('change');
//     result = true;
//     $('#scheduleOnDemand').on('change', function() {
//         if ($(this).is(':checked') === true) {
//             $(this).parents('form').each(function() {
//                 $("input[name^='scheduleCron']",this).each(function() {
//                     $(this).val('').prop('readonly',true).hide().parents('tr').hide();
//                 });
//             });
//         } else {
//             $(this).parents('form').each(function() {
//                 $("input[name^='scheduleCron']",this).each(function() {
//                     $(this).val('').prop('readonly',false).show().parents('tr').show();
//                 });
//             });
//         }
//     });
//     $("form.deploy-container").submit(function() {
//         if ($('#scheduleOnDemand').is(':checked')) {
//             $('.cronOptions > input[name^="scheduleCron"]', $(this)).each(function() {
//                 $(this).val('').prop('disabled', true);
//             });
//             return true;
//         } else {
//             $('.cronOptions > input[name^="scheduleCron"]', $(this)).each(function() {
//                 result = validateCronInputs($(this));
//                 if (result === false) return false;
//             });
//         }
//         return result;
//     }).each(function() {
//         $('input[name^="scheduleCron"]', this).each(function(id,value) {
//             if (!validateCronInputs($(this))) $(this).addClass('error');
//         }).blur(function() {
//             if (!validateCronInputs($(this))) $(this).addClass('error');
//         });
//     });
//     specialCrons();
// })(jQuery);
