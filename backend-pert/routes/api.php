<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PertApiController;

Route::post('/pert/calculate', [PertApiController::class, 'calculate']);

Route::get('/pert/projects', [PertApiController::class, 'listProjects']);
Route::get('/pert/projects/{filename}', [PertApiController::class, 'getProject']);
Route::delete('/pert/projects/{filename}', [PertApiController::class, 'deleteProject']);
